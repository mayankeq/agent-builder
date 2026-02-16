# Python Code Examples

Complete Python SDK for interacting with the Agent-Builder API.

## Installation

```bash
pip install requests websocket-client
```

## Complete SDK

```python
import requests
import json
import time
import websocket
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

class OutputType(Enum):
    SKILL = "skill"
    MCP = "mcp"
    CLI = "cli"
    LIBRARY = "library"

class Language(Enum):
    TYPESCRIPT = "typescript"
    PYTHON = "python"

class SessionStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class Session:
    id: str
    user_request: str
    status: SessionStatus
    current_phase: Optional[str]
    progress: float
    output_type: OutputType
    language: Language
    error: Optional[str]
    created_at: str
    updated_at: str
    completed_at: Optional[str]
    has_artifacts: bool

class AgentBuilderClient:
    """
    Python client for Agent-Builder API
    """

    def __init__(
        self,
        base_url: str = "https://api.agent-builder.com",
        token: Optional[str] = None
    ):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.session = requests.Session()

        if token:
            self.session.headers.update({
                'Authorization': f'Bearer {token}'
            })

    def set_token(self, token: str):
        """Set authentication token"""
        self.token = token
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })

    def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> requests.Response:
        """Make authenticated request"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response

    # Authentication

    def get_auth_providers(self) -> List[Dict[str, Any]]:
        """Get list of available OAuth providers"""
        response = self._request('GET', '/api/auth/providers')
        return response.json()['providers']

    def get_current_user(self) -> Dict[str, Any]:
        """Get current authenticated user"""
        response = self._request('GET', '/api/auth/me')
        return response.json()

    def refresh_token(self) -> str:
        """Refresh JWT token"""
        response = self._request('POST', '/api/auth/refresh')
        data = response.json()
        new_token = data['token']
        self.set_token(new_token)
        return new_token

    def logout(self):
        """Logout current session"""
        self._request('POST', '/api/auth/logout')

    def logout_all(self) -> int:
        """Logout from all devices"""
        response = self._request('POST', '/api/auth/logout-all')
        return response.json()['count']

    # API Keys

    def add_api_key(self, api_key: str) -> Dict[str, Any]:
        """
        Add or update Anthropic API key

        Args:
            api_key: Anthropic API key (format: sk-ant-...)

        Returns:
            Success response
        """
        response = self._request(
            'POST',
            '/api/api-keys',
            json={'apiKey': api_key}
        )
        return response.json()

    def validate_api_key(self) -> bool:
        """Validate stored API key"""
        try:
            response = self._request('POST', '/api/api-keys/validate')
            return response.json()['valid']
        except requests.HTTPError as e:
            if e.response.status_code == 400:
                return False
            raise

    def get_api_key_status(self) -> Dict[str, Any]:
        """Get API key status"""
        response = self._request('GET', '/api/api-keys/status')
        return response.json()

    def delete_api_key(self) -> Dict[str, Any]:
        """Delete stored API key"""
        response = self._request('DELETE', '/api/api-keys')
        return response.json()

    # Agent Creation

    def create_agent(
        self,
        description: str,
        output_type: OutputType = OutputType.MCP,
        language: Language = Language.TYPESCRIPT,
        interactive: bool = False
    ) -> str:
        """
        Create a new agent

        Args:
            description: Natural language description of the agent
            output_type: Output format (skill, mcp, cli, library)
            language: Programming language (typescript, python)
            interactive: Enable interactive clarification mode

        Returns:
            Session ID
        """
        response = self._request(
            'POST',
            '/api/agents/create',
            json={
                'description': description,
                'outputType': output_type.value,
                'language': language.value,
                'interactive': interactive
            }
        )
        return response.json()['sessionId']

    def get_examples(self) -> List[Dict[str, Any]]:
        """Get agent examples"""
        response = self._request('GET', '/api/agents/examples')
        return response.json()['examples']

    # Sessions

    def list_sessions(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[SessionStatus] = None
    ) -> Dict[str, Any]:
        """
        List user's sessions

        Args:
            page: Page number (1-indexed)
            page_size: Items per page (max 100)
            status: Filter by status

        Returns:
            Dict with sessions and pagination info
        """
        params = {
            'page': page,
            'pageSize': min(page_size, 100)
        }

        if status:
            params['status'] = status.value

        response = self._request('GET', '/api/sessions', params=params)
        return response.json()

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """Get detailed session information"""
        response = self._request('GET', f'/api/sessions/{session_id}')
        return response.json()

    def cancel_session(self, session_id: str) -> Dict[str, Any]:
        """Cancel an in-progress session"""
        response = self._request('POST', f'/api/sessions/{session_id}/cancel')
        return response.json()

    def delete_session(self, session_id: str) -> Dict[str, Any]:
        """Delete a session"""
        response = self._request('DELETE', f'/api/sessions/{session_id}')
        return response.json()

    def get_session_stats(self) -> Dict[str, Any]:
        """Get user's session statistics"""
        response = self._request('GET', '/api/sessions/stats')
        return response.json()

    # Downloads

    def download_artifacts(self, session_id: str, save_path: str):
        """
        Download session artifacts as ZIP

        Args:
            session_id: Session ID
            save_path: Path to save ZIP file
        """
        response = self._request(
            'GET',
            f'/api/downloads/{session_id}/artifacts',
            stream=True
        )

        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

    def get_download_url(
        self,
        session_id: str,
        expires_in: int = 3600
    ) -> Dict[str, Any]:
        """
        Get presigned download URL

        Args:
            session_id: Session ID
            expires_in: URL expiration time in seconds (max 7200)

        Returns:
            Dict with url and expiration info
        """
        response = self._request(
            'GET',
            f'/api/downloads/{session_id}/artifacts/url',
            params={'expiresIn': min(expires_in, 7200)}
        )
        return response.json()

    def get_artifacts_metadata(self, session_id: str) -> Dict[str, Any]:
        """Get artifacts metadata"""
        response = self._request(
            'GET',
            f'/api/downloads/{session_id}/metadata'
        )
        return response.json()

    # Utilities

    def wait_for_completion(
        self,
        session_id: str,
        poll_interval: int = 5,
        timeout: int = 3600,
        callback = None
    ) -> Session:
        """
        Wait for session to complete

        Args:
            session_id: Session ID
            poll_interval: Polling interval in seconds
            timeout: Maximum wait time in seconds
            callback: Optional callback function(session) called on each poll

        Returns:
            Completed session

        Raises:
            TimeoutError: If session doesn't complete within timeout
        """
        start_time = time.time()

        while True:
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Session did not complete within {timeout} seconds")

            data = self.get_session(session_id)
            session_data = data['session']

            if callback:
                callback(session_data)

            status = SessionStatus(session_data['status'])

            if status == SessionStatus.COMPLETED:
                return session_data

            if status == SessionStatus.FAILED:
                raise Exception(f"Session failed: {session_data.get('error')}")

            if status == SessionStatus.CANCELLED:
                raise Exception("Session was cancelled")

            time.sleep(poll_interval)


class AgentBuilderWebSocket:
    """WebSocket client for real-time progress updates"""

    def __init__(
        self,
        url: str = "wss://api.agent-builder.com",
        token: str = None
    ):
        self.url = url
        self.token = token
        self.ws = None
        self.callbacks = {
            'progress': [],
            'phase_complete': [],
            'status_change': [],
            'error': []
        }

    def connect(self):
        """Connect to WebSocket"""
        self.ws = websocket.WebSocketApp(
            self.url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close
        )

    def _on_open(self, ws):
        """Handle connection open"""
        if self.token:
            ws.send(json.dumps({
                'type': 'auth',
                'token': self.token
            }))

    def _on_message(self, ws, message):
        """Handle incoming message"""
        data = json.loads(message)
        message_type = data.get('type')

        if message_type in self.callbacks:
            for callback in self.callbacks[message_type]:
                callback(data)

    def _on_error(self, ws, error):
        """Handle error"""
        print(f"WebSocket error: {error}")

    def _on_close(self, ws, close_status_code, close_msg):
        """Handle connection close"""
        print("WebSocket closed")

    def subscribe(self, session_id: str):
        """Subscribe to session updates"""
        if self.ws:
            self.ws.send(json.dumps({
                'type': 'subscribe',
                'sessionId': session_id
            }))

    def on(self, event: str, callback):
        """Register event callback"""
        if event in self.callbacks:
            self.callbacks[event].append(callback)

    def run(self):
        """Start WebSocket connection"""
        self.ws.run_forever()


# Example Usage
if __name__ == '__main__':
    # Initialize client
    client = AgentBuilderClient(token='your-jwt-token')

    # Check API key status
    status = client.get_api_key_status()
    print(f"API Key exists: {status.get('exists')}")

    # Add API key if needed
    if not status.get('exists'):
        client.add_api_key('sk-ant-api03-...')

    # Create agent
    session_id = client.create_agent(
        description="A web scraper for e-commerce price monitoring",
        output_type=OutputType.MCP,
        language=Language.TYPESCRIPT
    )
    print(f"Created session: {session_id}")

    # Method 1: Poll for completion
    def progress_callback(session):
        print(f"Progress: {session['progress'] * 100:.0f}% - Phase: {session.get('currentPhase')}")

    try:
        completed_session = client.wait_for_completion(
            session_id,
            poll_interval=5,
            callback=progress_callback
        )
        print(f"Session completed!")
    except Exception as e:
        print(f"Error: {e}")

    # Download artifacts
    client.download_artifacts(session_id, f'{session_id}.zip')
    print(f"Downloaded artifacts to {session_id}.zip")

    # Method 2: WebSocket for real-time updates
    ws_client = AgentBuilderWebSocket(token='your-jwt-token')

    def on_progress(data):
        print(f"Progress: {data['progress'] * 100:.0f}%")

    def on_status_change(data):
        if data['status'] == 'completed':
            client.download_artifacts(data['sessionId'], f"{data['sessionId']}.zip")

    ws_client.on('progress', on_progress)
    ws_client.on('status_change', on_status_change)

    ws_client.connect()
    ws_client.subscribe(session_id)
    ws_client.run()
```

## Simple Examples

### Create Agent and Wait

```python
from agent_builder import AgentBuilderClient, OutputType, Language

client = AgentBuilderClient(token='your-jwt-token')

# Create agent
session_id = client.create_agent(
    description="A log parser that extracts error patterns",
    output_type=OutputType.CLI,
    language=Language.PYTHON
)

# Wait for completion
session = client.wait_for_completion(
    session_id,
    callback=lambda s: print(f"{s['currentPhase']}: {s['progress']*100:.0f}%")
)

# Download
client.download_artifacts(session_id, 'artifacts.zip')
```

### List and Filter Sessions

```python
from agent_builder import AgentBuilderClient, SessionStatus

client = AgentBuilderClient(token='your-jwt-token')

# Get all completed sessions
result = client.list_sessions(status=SessionStatus.COMPLETED)

for session in result['sessions']:
    print(f"{session['id']}: {session['userRequest']}")

# Pagination
page = 1
while True:
    result = client.list_sessions(page=page, page_size=50)

    for session in result['sessions']:
        print(session)

    if not result['pagination']['hasNext']:
        break

    page += 1
```

### Batch Agent Creation

```python
from agent_builder import AgentBuilderClient, OutputType, Language
import concurrent.futures

client = AgentBuilderClient(token='your-jwt-token')

agents_to_create = [
    ("Web scraper for news sites", OutputType.MCP, Language.TYPESCRIPT),
    ("CSV data processor", OutputType.CLI, Language.PYTHON),
    ("GitHub API client", OutputType.LIBRARY, Language.TYPESCRIPT),
]

def create_and_wait(description, output_type, language):
    session_id = client.create_agent(description, output_type, language)
    print(f"Created {session_id}")

    session = client.wait_for_completion(session_id)
    client.download_artifacts(session_id, f"{session_id}.zip")

    return session_id

# Create agents concurrently (respecting rate limits)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    futures = [
        executor.submit(create_and_wait, desc, ot, lang)
        for desc, ot, lang in agents_to_create
    ]

    for future in concurrent.futures.as_completed(futures):
        session_id = future.result()
        print(f"Completed: {session_id}")
```

### Error Handling

```python
from agent_builder import AgentBuilderClient
import requests

client = AgentBuilderClient(token='your-jwt-token')

try:
    session_id = client.create_agent(
        description="A web scraper",
        output_type="mcp",
        language="typescript"
    )

except requests.HTTPError as e:
    if e.response.status_code == 400:
        error = e.response.json()
        print(f"Validation error: {error['message']}")

    elif e.response.status_code == 401:
        print("Unauthorized. Please refresh token.")
        token = client.refresh_token()

    elif e.response.status_code == 429:
        retry_after = e.response.headers.get('Retry-After', 60)
        print(f"Rate limited. Retry after {retry_after} seconds")

    else:
        print(f"Error: {e}")

except Exception as e:
    print(f"Unexpected error: {e}")
```

### WebSocket Real-Time Monitoring

```python
from agent_builder import AgentBuilderClient, AgentBuilderWebSocket
import threading

client = AgentBuilderClient(token='your-jwt-token')

# Create agent
session_id = client.create_agent(
    description="Price monitoring agent",
    output_type="mcp",
    language="typescript"
)

# Monitor via WebSocket
ws = AgentBuilderWebSocket(token='your-jwt-token')

completed = threading.Event()

def on_progress(data):
    print(f"Progress: {data['progress'] * 100:.0f}%")
    print(f"Phase: {data.get('currentPhase', 'unknown')}")

def on_status_change(data):
    print(f"Status changed: {data['status']}")

    if data['status'] == 'completed':
        print("Agent creation completed!")
        client.download_artifacts(data['sessionId'], f"{data['sessionId']}.zip")
        completed.set()

    elif data['status'] == 'failed':
        print(f"Agent creation failed: {data.get('error')}")
        completed.set()

ws.on('progress', on_progress)
ws.on('status_change', on_status_change)

ws.connect()
ws.subscribe(session_id)

# Run WebSocket in background thread
ws_thread = threading.Thread(target=ws.run)
ws_thread.daemon = True
ws_thread.start()

# Wait for completion
completed.wait(timeout=3600)  # 1 hour timeout
```

### Download with Progress Bar

```python
from agent_builder import AgentBuilderClient
import requests
from tqdm import tqdm

client = AgentBuilderClient(token='your-jwt-token')

def download_with_progress(session_id: str, save_path: str):
    """Download artifacts with progress bar"""
    response = client.session.get(
        f"{client.base_url}/api/downloads/{session_id}/artifacts",
        stream=True
    )
    response.raise_for_status()

    total_size = int(response.headers.get('content-length', 0))

    with open(save_path, 'wb') as f:
        with tqdm(total=total_size, unit='B', unit_scale=True) as pbar:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                pbar.update(len(chunk))

# Usage
download_with_progress(session_id, 'artifacts.zip')
```

## Testing

```python
import unittest
from agent_builder import AgentBuilderClient, OutputType, Language

class TestAgentBuilder(unittest.TestCase):
    def setUp(self):
        self.client = AgentBuilderClient(token='test-token')

    def test_create_agent(self):
        session_id = self.client.create_agent(
            description="Test agent",
            output_type=OutputType.MCP,
            language=Language.TYPESCRIPT
        )
        self.assertIsNotNone(session_id)

    def test_list_sessions(self):
        result = self.client.list_sessions(page=1, page_size=10)
        self.assertIn('sessions', result)
        self.assertIn('pagination', result)

    def test_api_key_status(self):
        status = self.client.get_api_key_status()
        self.assertIn('exists', status)

if __name__ == '__main__':
    unittest.main()
```
