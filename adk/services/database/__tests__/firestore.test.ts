import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { FirestoreService } from '../firestore';

// Mock Firestore client
jest.mock('@google-cloud/firestore', () => {
  const mockDoc = {
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ id: 'test-id', name: 'Test Document' }),
      id: 'test-id'
    }),
    set: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({})
  };

  const mockCollection = {
    doc: jest.fn().mockReturnValue(mockDoc),
    add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      empty: false,
      docs: [
        {
          exists: true,
          data: () => ({ id: 'test-id', name: 'Test Document' }),
          id: 'test-id'
        }
      ]
    })
  };

  return {
    Firestore: jest.fn().mockImplementation(() => {
      return {
        collection: jest.fn().mockReturnValue(mockCollection),
        settings: jest.fn()
      };
    })
  };
});

describe('FirestoreService', () => {
  let service: FirestoreService;
  const mockConfig = {
    projectId: 'test-project'
  };

  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    service = new FirestoreService(mockConfig);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with config values', () => {
    expect(service['config'].projectId).toBe('test-project');
  });

  it('should get a document', async () => {
    const doc = await service.get('users', 'test-id');
    
    // Verify Firestore methods were called correctly
    expect(service['firestore'].collection).toHaveBeenCalledWith('users');
    const mockCollection = service['firestore'].collection('users');
    expect(mockCollection.doc).toHaveBeenCalledWith('test-id');
    
    // Verify returned document
    expect(doc).toEqual({ id: 'test-id', name: 'Test Document' });
  });

  it('should create a document', async () => {
    const data = { name: 'New Document' };
    const id = await service.create('users', data);
    
    // Verify Firestore methods were called correctly
    expect(service['firestore'].collection).toHaveBeenCalledWith('users');
    const mockCollection = service['firestore'].collection('users');
    expect(mockCollection.add).toHaveBeenCalledWith(data);
    
    // Verify returned ID
    expect(id).toBe('new-doc-id');
  });

  it('should update a document', async () => {
    const data = { name: 'Updated Document' };
    await service.update('users', 'test-id', data);
    
    // Verify Firestore methods were called correctly
    expect(service['firestore'].collection).toHaveBeenCalledWith('users');
    const mockCollection = service['firestore'].collection('users');
    expect(mockCollection.doc).toHaveBeenCalledWith('test-id');
    
    const mockDoc = mockCollection.doc('test-id');
    expect(mockDoc.update).toHaveBeenCalledWith(data);
  });

  it('should delete a document', async () => {
    await service.delete('users', 'test-id');
    
    // Verify Firestore methods were called correctly
    expect(service['firestore'].collection).toHaveBeenCalledWith('users');
    const mockCollection = service['firestore'].collection('users');
    expect(mockCollection.doc).toHaveBeenCalledWith('test-id');
    
    const mockDoc = mockCollection.doc('test-id');
    expect(mockDoc.delete).toHaveBeenCalled();
  });

  it('should query documents', async () => {
    const query = {
      where: [{ field: 'name', operator: '==', value: 'Test Document' }],
      orderBy: [{ field: 'created', direction: 'desc' }],
      limit: 10
    };
    
    const docs = await service.query('users', query);
    
    // Verify Firestore methods were called correctly
    expect(service['firestore'].collection).toHaveBeenCalledWith('users');
    const mockCollection = service['firestore'].collection('users');
    expect(mockCollection.where).toHaveBeenCalledWith('name', '==', 'Test Document');
    expect(mockCollection.orderBy).toHaveBeenCalledWith('created', 'desc');
    expect(mockCollection.limit).toHaveBeenCalledWith(10);
    
    // Verify returned documents
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 'test-id', name: 'Test Document' });
  });
});
