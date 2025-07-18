import { SerialPort } from '../types/serialPort';
import { ConnectionPanel } from './ConnectionPanel';
import { DataTransmission } from './DataTransmission';
import { useSerialPortStore } from '../store/serialPortStore';

interface SerialPortManagerProps {
  selectedPort: SerialPort;
}

export const SerialPortManager = ({ selectedPort }: SerialPortManagerProps) => {
  const { connectionStatus } = useSerialPortStore();

  return (
    <div className="space-y-6">
      <ConnectionPanel 
        selectedPort={selectedPort}
        connectionStatus={connectionStatus}
      />

      <DataTransmission
        isConnected={connectionStatus === 'connected'}
      />
    </div>
  );
};
