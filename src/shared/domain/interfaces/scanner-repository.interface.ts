import { Scanner, ScannerStatus, ScannerRole } from '../entities/scanner.entity';

export interface IScannerRepository {
  save(scanner: Scanner): Promise<Scanner>;
  findById(id: string): Promise<Scanner | null>;
  findByApiKey(apiKey: string): Promise<Scanner | null>;
  findByName(name: string): Promise<Scanner | null>;
  findAll(): Promise<Scanner[]>;
  findByLocation(location: string): Promise<Scanner[]>;
  findByStatus(status: ScannerStatus): Promise<Scanner[]>;
  findByRole(role: ScannerRole): Promise<Scanner[]>;
  update(scanner: Scanner): Promise<Scanner>;
  delete(id: string): Promise<void>;
}
