import { useState, useEffect } from 'react';
import { walletKit, pairWithDapp, getActiveSessions, disconnectSession } from './walletConnect';

export function WalletConnectComponent() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [connectionUri, setConnectionUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Load active sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const activeSessions = getActiveSessions();
    setSessions(Object.values(activeSessions));
  };

  const handleConnect = async () => {
    if (!connectionUri.trim()) {
      alert('Please enter a WalletConnect URI');
      return;
    }

    setIsConnecting(true);
    try {
      await pairWithDapp(connectionUri);
      setConnectionUri('');
      
      // Reload sessions after connection
      setTimeout(loadSessions, 1000);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect. Please check the URI and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (topic: string) => {
    try {
      await disconnectSession(topic);
      loadSessions();
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect session');
    }
  };

  return (
    <div className="wallet-connect-container">
      <h2>WalletConnect</h2>

      {/* Connection Input */}
      <div className="connection-section">
        <h3>Connect to dApp</h3>
        <div className="input-group">
          <input
            type="text"
            value={connectionUri}
            onChange={(e) => setConnectionUri(e.target.value)}
            placeholder="Paste WalletConnect URI (wc:...)"
            className="uri-input"
          />
          <button
            onClick={handleConnect}
            disabled={isConnecting || !connectionUri.trim()}
            className="connect-button"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="sessions-section">
        <h3>Active Sessions ({sessions.length})</h3>
        {sessions.length === 0 ? (
          <p className="no-sessions">No active sessions</p>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.topic} className="session-item">
                <div className="session-info">
                  <div className="session-name">
                    {session.peer?.metadata?.name || 'Unknown dApp'}
                  </div>
                  <div className="session-url">
                    {session.peer?.metadata?.url || 'No URL'}
                  </div>
                  <div className="session-description">
                    {session.peer?.metadata?.description || 'No description'}
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(session.topic)}
                  className="disconnect-button"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .wallet-connect-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        h2 {
          margin-bottom: 24px;
        }

        h3 {
          margin-bottom: 16px;
          font-size: 18px;
        }

        .connection-section {
          margin-bottom: 32px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .input-group {
          display: flex;
          gap: 8px;
        }

        .uri-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .uri-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .connect-button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }

        .connect-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .connect-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .sessions-section {
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .no-sessions {
          color: #666;
          font-style: italic;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 6px;
          gap: 16px;
        }

        .session-info {
          flex: 1;
        }

        .session-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .session-url {
          font-size: 13px;
          color: #007bff;
          margin-bottom: 4px;
        }

        .session-description {
          font-size: 12px;
          color: #666;
        }

        .disconnect-button {
          padding: 8px 16px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
        }

        .disconnect-button:hover {
          background-color: #c82333;
        }
      `}</style>
    </div>
  );
}
