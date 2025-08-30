// Enterprise-grade TypeScript Gadget Tracker
// 100% TS, secure, versioned, encrypted, and history-enabled

import * as crypto from 'crypto';

export interface Gadget {
  id: string;              // Unique identifier
  name: string;
  brand: string;
  price: number;
  addedAt: Date;
}

export interface GadgetHistoryEntry {
  action: 'ADD' | 'UPDATE' | 'DELETE';
  gadget: Gadget;
  timestamp: Date;
}

export interface EncryptedExport {
  version: number;
  iv: string;
  data: string; // encrypted JSON
}

export class EnterpriseGadgetTracker {
  private gadgets: Map<string, Gadget> = new Map();
  private history: GadgetHistoryEntry[] = [];
  private version: number = 1;

  constructor(initialGadgets?: Gadget[]) {
    if (initialGadgets) {
      initialGadgets.forEach(g => this.gadgets.set(g.id, g));
    }
  }

  /** Add a new gadget */
  addGadget(name: string, brand: string, price: number): Gadget {
    if (!name || !brand || price < 0) {
      throw new Error('Invalid gadget data.');
    }

    const gadget: Gadget = {
      id: this.generateId(),
      name,
      brand,
      price,
      addedAt: new Date()
    };

    this.gadgets.set(gadget.id, gadget);
    this.recordHistory('ADD', gadget);
    return gadget;
  }

  /** Update an existing gadget */
  updateGadget(id: string, data: Partial<Omit<Gadget, 'id' | 'addedAt'>>): Gadget | null {
    const gadget = this.gadgets.get(id);
    if (!gadget) return null;

    if (data.name !== undefined) gadget.name = data.name;
    if (data.brand !== undefined) gadget.brand = data.brand;
    if (data.price !== undefined) {
      if (data.price < 0) throw new Error('Price cannot be negative.');
      gadget.price = data.price;
    }

    this.recordHistory('UPDATE', { ...gadget });
    return gadget;
  }

  /** Delete a gadget */
  deleteGadget(id: string): boolean {
    const gadget = this.gadgets.get(id);
    if (!gadget) return false;

    this.gadgets.delete(id);
    this.recordHistory('DELETE', gadget);
    return true;
  }

  /** List all gadgets sorted by addedAt descending */
  listGadgets(): Gadget[] {
    return Array.from(this.gadgets.values()).sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  /** Find gadgets by name or brand */
  findGadgets(query: string): Gadget[] {
    const q = query.toLowerCase();
    return Array.from(this.gadgets.values()).filter(g => 
      g.name.toLowerCase().includes(q) || g.brand.toLowerCase().includes(q)
    );
  }

  /** Total value of all gadgets */
  totalValue(): number {
    return Array.from(this.gadgets.values()).reduce((sum, g) => sum + g.price, 0);
  }

  /** Get history */
  getHistory(): GadgetHistoryEntry[] {
    return [...this.history].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /** Export gadgets securely with AES-256 encryption */
  exportEncrypted(secret: string): EncryptedExport {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.createKey(secret), iv);
    const data = JSON.stringify({
      gadgets: Array.from(this.gadgets.values()),
      history: this.history,
      version: this.version
    });
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      version: this.version,
      iv: iv.toString('hex'),
      data: encrypted
    };
  }

  /** Import encrypted gadgets */
  importEncrypted(encryptedExport: EncryptedExport, secret: string): void {
    const iv = Buffer.from(encryptedExport.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.createKey(secret), iv);
    let decrypted = decipher.update(encryptedExport.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const parsed = JSON.parse(decrypted);
    if (!parsed || !Array.isArray(parsed.gadgets) || !Array.isArray(parsed.history)) {
      throw new Error('Invalid encrypted data.');
    }

    this.gadgets.clear();
    parsed.gadgets.forEach((g: any) => {
      g.addedAt = new Date(g.addedAt);
      this.gadgets.set(g.id, g);
    });

    this.history = parsed.history.map((h: any) => ({
      ...h,
      timestamp: new Date(h.timestamp)
    }));

    this.version = parsed.version || 1;
  }

  /** Private helpers */

  private generateId(): string {
    return 'gadget-' + crypto.randomBytes(6).toString('hex');
  }

  private recordHistory(action: 'ADD' | 'UPDATE' | 'DELETE', gadget: Gadget) {
    this.history.push({
      action,
      gadget: { ...gadget },
      timestamp: new Date()
    });
  }

  private createKey(secret: string): Buffer {
    return crypto.createHash('sha256').update(secret).digest();
  }
}
