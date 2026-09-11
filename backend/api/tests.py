from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import CompressionSession, CostLog
from api.services.cost_tracker import (
    compute_request_metrics,
    project_enterprise_savings,
    get_pricing_for_model
)
from api.services.fidelity import evaluate_fidelity
from api.services.compressor import count_tokens, compile_prompt_to_sir


class CostTrackerServiceTests(TestCase):
    def test_pricing_lookup(self):
        pricing_gpt = get_pricing_for_model("gpt-4o")
        self.assertEqual(pricing_gpt["input_per_1m"], 2.50)
        self.assertEqual(pricing_gpt["output_per_1m"], 10.00)

        pricing_claude = get_pricing_for_model("claude-3.5-sonnet")
        self.assertEqual(pricing_claude["input_per_1m"], 3.00)

    def test_metrics_calculation(self):
        metrics = compute_request_metrics(
            raw_tokens=200,
            sir_tokens=50,
            target_model="gpt-4o"
        )
        self.assertEqual(metrics["tokens_saved"], 150)
        self.assertEqual(metrics["token_reduction_pct"], 75.0)
        self.assertGreater(metrics["cost_saved_usd"], 0.0)

    def test_enterprise_projections(self):
        proj = project_enterprise_savings(
            cost_saved_per_request=0.0003,
            tokens_saved_per_request=120,
            monthly_volumes=[10000, 100000]
        )
        self.assertIn("gpt-4o", proj)
        self.assertIn("claude-3.5-sonnet", proj)
        self.assertEqual(len(proj["gpt-4o"]["tiers"]), 2)


class FidelityServiceTests(TestCase):
    def test_fidelity_evaluation(self):
        prompt = "Write a Python function to filter numbers above 10."
        sir_yaml = "goal: filter_numbers(nums: list[int], threshold: int=10) -> list[int]\nspec:\n  filter: num > threshold"
        score, passed = evaluate_fidelity(prompt, sir_yaml)
        self.assertIsInstance(score, float)
        self.assertTrue(0.0 <= score <= 1.0)


class CompressionSessionModelTests(TestCase):
    def test_auto_prune_signal(self):
        # Create 505 sessions to trigger the 500 cap
        sessions = [
            CompressionSession(
                raw_prompt=f"Prompt {i}",
                sir_yaml=f"SIR {i}",
                target_model="gpt-4o",
                raw_token_count=100,
                sir_token_count=30,
                tokens_saved=70,
                token_reduction_pct=70.0,
                fidelity_score=0.95
            )
            for i in range(505)
        ]
        CompressionSession.objects.bulk_create(sessions)
        
        # Trigger post_save
        last_session = CompressionSession.objects.create(
            raw_prompt="Last Prompt",
            sir_yaml="Last SIR",
            target_model="gpt-4o"
        )
        
        # Verify count does not exceed 500
        count = CompressionSession.objects.count()
        self.assertLessEqual(count, 500)


class APIRestEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_pricing_endpoint(self):
        res = self.client.get('/api/pricing/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('pricing', res.data)
        self.assertIn('gpt-4o', res.data['pricing'])

    def test_health_endpoint(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'online')
        self.assertIn('engines', res.data)

    def test_compress_endpoint(self):
        payload = {
            "raw_prompt": "Hey there! I really need some help writing a clean Python function. I have this large list of dictionaries where each dictionary represents an event with a 'timestamp' key (which is a Unix epoch integer) and a float 'value' key. I need a function called filter_events that takes this list, sorts it by timestamp in ascending order, and then filters it so it only returns entries where the value is strictly greater than a threshold parameter that the caller passes in. Please make sure to add standard PEP-484 type hints and a descriptive docstring explaining the parameters. Thanks so much!",
            "target_model": "gpt-4o",
            "compression_engine": "auto"
        }
        res = self.client.post('/api/compress/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('session', res.data)
        self.assertIn('cost_metrics', res.data)
        self.assertIn('projections', res.data)
        self.assertIn('fidelity', res.data)

        session_id = res.data['session']['id']

        # Test history endpoint has this session
        res_hist = self.client.get('/api/history/')
        self.assertEqual(res_hist.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res_hist.data['count'], 1)

        # Test execute endpoint
        exec_payload = {
            "session_id": session_id
        }
        res_exec = self.client.post('/api/execute/', exec_payload, format='json')
        self.assertEqual(res_exec.status_code, status.HTTP_200_OK)
        self.assertIn('llm_response', res_exec.data)
        self.assertIn('inference_latency_ms', res_exec.data)

    def test_passthrough_guard_pre_check(self):
        # Short prompt (< 60 tokens)
        short_prompt = "Hello, write factorial in python"
        payload = {
            "raw_prompt": short_prompt,
            "target_model": "gpt-4o"
        }
        res = self.client.post('/api/compress/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data.get('is_passthrough'))
        self.assertIn(res.data.get('passthrough_status'), ['PASSTHROUGH_OPTIMAL', 'PASSTHROUGH_ALREADY_OPTIMAL'])
        self.assertEqual(res.data['session']['sir_yaml'], short_prompt)
        self.assertEqual(res.data['cost_metrics']['token_reduction_pct'], 0.0)
        self.assertEqual(res.data['fidelity']['score'], 1.0)


class OpenAIDropInProxyTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_proxy_unauthorized_without_bearer(self):
        payload = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "Write hello world"}]
        }
        res = self.client.post('/api/v1/chat/completions', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", res.data)
        self.assertEqual(res.data["error"]["code"], "unauthorized")

    def test_proxy_missing_messages(self):
        headers = {'HTTP_AUTHORIZATION': 'Bearer sk-mocktestkey123'}
        payload = {
            "model": "gpt-4o"
        }
        res = self.client.post('/api/v1/chat/completions', payload, format='json', **headers)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res.data)

    @patch('requests.post')
    def test_proxy_successful_byok_forwarding(self, mock_post):
        # Mock upstream OpenAI response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "chatcmpl-test-12345",
            "object": "chat.completion",
            "created": 1700000000,
            "model": "gpt-4o",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "def filter_events(events, threshold):\n    return [e for e in sorted(events, key=lambda x: x['timestamp']) if e['value'] > threshold]"
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 42,
                "completion_tokens": 28,
                "total_tokens": 70
            }
        }
        mock_post.return_value = mock_response

        headers = {'HTTP_AUTHORIZATION': 'Bearer sk-test-byok-user-key'}
        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": "You are a helpful coding assistant."},
                {"role": "user", "content": "Hey there! I really need some help writing a clean Python function. I have this large list of dictionaries where each dictionary represents an event with a 'timestamp' key (which is a Unix epoch integer) and a float 'value' key. I need a function called filter_events that takes this list, sorts it by timestamp in ascending order, and then filters it so it only returns entries where the value is strictly greater than a threshold parameter that the caller passes in. Please make sure to add standard PEP-484 type hints and a descriptive docstring explaining the parameters. Thanks so much!"}
            ],
            "temperature": 0.2
        }

        res = self.client.post('/api/v1/chat/completions/', payload, format='json', **headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("choices", res.data)
        self.assertEqual(res.data["choices"][0]["message"]["role"], "assistant")

        # Verify custom telemetry headers
        self.assertIn("x-sir-tokens-saved", res.headers)
        self.assertIn("x-sir-savings-usd", res.headers)
        self.assertIn("x-sir-status", res.headers)
        self.assertIn("x-sir-fidelity", res.headers)

        # Verify session logged in database
        session = CompressionSession.objects.first()
        self.assertIsNotNone(session)
        self.assertEqual(session.target_model, "gpt-4o")
        self.assertGreater(session.tokens_saved, 0)
        self.assertIn("Proxy", session.compression_engine)
