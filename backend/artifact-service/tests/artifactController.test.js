// Set env variables before requiring any module
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock external dependencies before requiring the app
jest.mock('../src/utils/cloudinaryHelper');
jest.mock('../src/services/aiService');

const cloudinaryHelper = require('../src/utils/cloudinaryHelper');
const aiService = require('../src/services/aiService');
const app = require('../src/index');
const Artifact = require('../src/models/Artifact');

let mongoServer;

// ─── DB lifecycle ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Artifact.deleteMany({});
  jest.clearAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sampleArtifact = (overrides = {}) => ({
  name: 'Traditional Vedda Bow',
  description: 'A wooden bow crafted from naturally curved branches used for hunting',
  category: 'weapons',
  location: 'Central Highlands, Sri Lanka',
  tags: ['hunting-tool', 'archery-equipment'],
  createdBy: 'admin',
  ...overrides,
});

const createArtifact = (overrides = {}) => Artifact.create(sampleArtifact(overrides));

// ─── POST /api/artifacts/upload/single ───────────────────────────────────────
describe('POST /api/artifacts/upload/single', () => {
  it('should upload a single image and return the cloudinary result', async () => {
    cloudinaryHelper.uploadToCloudinary.mockResolvedValue({
      url: 'https://res.cloudinary.com/vedda/image1.jpg',
      publicId: 'vedda/image1',
    });

    const res = await request(app)
      .post('/api/artifacts/upload/single')
      .attach('image', Buffer.from('fake-image-content'), {
        filename: 'bow.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe('https://res.cloudinary.com/vedda/image1.jpg');
    expect(cloudinaryHelper.uploadToCloudinary).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when no file is provided', async () => {
    const res = await request(app).post('/api/artifacts/upload/single');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Please upload an image file/i);
  });

  it('should return 500 when cloudinary upload fails', async () => {
    cloudinaryHelper.uploadToCloudinary.mockRejectedValue(new Error('Cloudinary unavailable'));

    const res = await request(app)
      .post('/api/artifacts/upload/single')
      .attach('image', Buffer.from('fake-image-content'), {
        filename: 'bow.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/artifacts/upload/multiple ─────────────────────────────────────
describe('POST /api/artifacts/upload/multiple', () => {
  it('should upload multiple images and return all cloudinary results', async () => {
    cloudinaryHelper.uploadMultipleToCloudinary.mockResolvedValue([
      { url: 'https://res.cloudinary.com/vedda/image1.jpg', publicId: 'vedda/image1' },
      { url: 'https://res.cloudinary.com/vedda/image2.jpg', publicId: 'vedda/image2' },
    ]);

    const res = await request(app)
      .post('/api/artifacts/upload/multiple')
      .attach('images', Buffer.from('fake-image-1'), { filename: 'img1.jpg', contentType: 'image/jpeg' })
      .attach('images', Buffer.from('fake-image-2'), { filename: 'img2.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('should return 400 when no files are provided', async () => {
    const res = await request(app).post('/api/artifacts/upload/multiple');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Please upload at least one image file/i);
  });
});

// ─── POST /api/artifacts ──────────────────────────────────────────────────────
describe('POST /api/artifacts', () => {
  it('should create an artifact with valid data', async () => {
    const res = await request(app).post('/api/artifacts').send(sampleArtifact());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Traditional Vedda Bow');
    expect(res.body.data._id).toBeDefined();
  });

  it('should return 400 when name is missing', async () => {
    const { name, ...noName } = sampleArtifact();
    const res = await request(app).post('/api/artifacts').send(noName);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when description is missing', async () => {
    const { description, ...noDesc } = sampleArtifact();
    const res = await request(app).post('/api/artifacts').send(noDesc);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when category is invalid', async () => {
    const res = await request(app)
      .post('/api/artifacts')
      .send(sampleArtifact({ category: 'InvalidCategory' }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when createdBy is missing', async () => {
    const { createdBy, ...noCreatedBy } = sampleArtifact();
    const res = await request(app).post('/api/artifacts').send(noCreatedBy);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/artifacts ───────────────────────────────────────────────────────
describe('GET /api/artifacts', () => {
  beforeEach(async () => {
    await Artifact.create([
      sampleArtifact({ name: 'Traditional Vedda Bow', category: 'weapons', tags: ['hunting'] }),
      sampleArtifact({ name: 'Vedda Clay Pottery', category: 'pottery', description: 'Hand-crafted clay vessel', tags: ['pottery'] }),
      sampleArtifact({ name: 'Stone Cutting Tools', category: 'tools', description: 'Ancient stone blades', tags: ['stone', 'cutting'] }),
    ]);
  });

  it('should return all artifacts with pagination metadata', async () => {
    const res = await request(app).get('/api/artifacts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.artifacts).toHaveLength(3);
    expect(res.body.pagination).toMatchObject({ total: 3, page: 1 });
  });

  it('should filter artifacts by category', async () => {
    const res = await request(app).get('/api/artifacts?category=weapons');

    expect(res.status).toBe(200);
    expect(res.body.artifacts).toHaveLength(1);
    expect(res.body.artifacts[0].category).toBe('weapons');
  });

  it('should search artifacts by name', async () => {
    const res = await request(app).get('/api/artifacts?search=Bow');

    expect(res.status).toBe(200);
    expect(res.body.artifacts.length).toBeGreaterThan(0);
    expect(res.body.artifacts[0].name).toContain('Bow');
  });

  it('should search artifacts by tag', async () => {
    const res = await request(app).get('/api/artifacts?search=stone');

    expect(res.status).toBe(200);
    expect(res.body.artifacts.length).toBeGreaterThan(0);
  });

  it('should respect limit pagination', async () => {
    const res = await request(app).get('/api/artifacts?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.artifacts).toHaveLength(2);
    expect(res.body.pagination.pages).toBe(2);
  });

  it('should return second page of results', async () => {
    const res = await request(app).get('/api/artifacts?page=2&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.artifacts).toHaveLength(1);
    expect(res.body.pagination.page).toBe(2);
  });

  it('should return empty array when no artifacts match search', async () => {
    const res = await request(app).get('/api/artifacts?search=nonexistentterm12345');

    expect(res.status).toBe(200);
    expect(res.body.artifacts).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });
});

// ─── GET /api/artifacts/:id ───────────────────────────────────────────────────
describe('GET /api/artifacts/:id', () => {
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id.toString();
  });

  it('should return the artifact for a valid ID', async () => {
    const res = await request(app).get(`/api/artifacts/${artifactId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(artifactId);
    expect(res.body.data.name).toBe('Traditional Vedda Bow');
  });

  it('should return 404 for a non-existent artifact ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/artifacts/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── PUT /api/artifacts/:id ───────────────────────────────────────────────────
describe('PUT /api/artifacts/:id', () => {
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id.toString();
  });

  it('should update an artifact with new values', async () => {
    const res = await request(app)
      .put(`/api/artifacts/${artifactId}`)
      .send({ name: 'Updated Bow Name', description: 'Updated description of the bow artifact' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Bow Name');
    expect(res.body.data.description).toBe('Updated description of the bow artifact');
  });

  it('should persist updated data in the database', async () => {
    await request(app)
      .put(`/api/artifacts/${artifactId}`)
      .send({ location: 'Batticaloa District, Sri Lanka' });

    const artifact = await Artifact.findById(artifactId);
    expect(artifact.location).toBe('Batticaloa District, Sri Lanka');
  });

  it('should return 404 when updating a non-existent artifact', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).put(`/api/artifacts/${fakeId}`).send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when updating with an invalid category', async () => {
    const res = await request(app)
      .put(`/api/artifacts/${artifactId}`)
      .send({ category: 'InvalidCategory' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── DELETE /api/artifacts/:id ────────────────────────────────────────────────
describe('DELETE /api/artifacts/:id', () => {
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id.toString();
  });

  it('should delete an artifact and return success', async () => {
    const res = await request(app).delete(`/api/artifacts/${artifactId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('should actually remove the artifact from the database', async () => {
    await request(app).delete(`/api/artifacts/${artifactId}`);

    const artifact = await Artifact.findById(artifactId);
    expect(artifact).toBeNull();
  });

  it('should return 404 when deleting a non-existent artifact', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/artifacts/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/artifacts/category/:category ───────────────────────────────────
describe('GET /api/artifacts/category/:category', () => {
  beforeEach(async () => {
    await Artifact.create([
      sampleArtifact({ name: 'Vedda Bow', category: 'weapons' }),
      sampleArtifact({ name: 'Hunting Spear', category: 'weapons' }),
      sampleArtifact({ name: 'Clay Pot', category: 'pottery', description: 'Traditional clay pot' }),
    ]);
  });

  it('should return all artifacts for a given category', async () => {
    const res = await request(app).get('/api/artifacts/category/weapons');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.data.every((a) => a.category === 'weapons')).toBe(true);
  });

  it('should return zero count for a category with no artifacts', async () => {
    const res = await request(app).get('/api/artifacts/category/jewelry');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toHaveLength(0);
  });
});

// ─── POST /api/artifacts/with-image ──────────────────────────────────────────
describe('POST /api/artifacts/with-image', () => {
  it('should create artifact and upload image to cloudinary', async () => {
    cloudinaryHelper.uploadToCloudinary.mockResolvedValue({
      url: 'https://res.cloudinary.com/vedda/bow.jpg',
      publicId: 'vedda/bow',
    });

    const res = await request(app)
      .post('/api/artifacts/with-image')
      .field('name', 'Vedda Bow with Image')
      .field('description', 'A hunting bow with an uploaded image attached')
      .field('category', 'weapons')
      .field('location', 'Central Highlands, Sri Lanka')
      .field('createdBy', 'admin')
      .field('tags', JSON.stringify(['hunting', 'archery']))
      .attach('image', Buffer.from('fake-image-content'), {
        filename: 'bow.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.imageUrl).toBe('https://res.cloudinary.com/vedda/bow.jpg');
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0].isPrimary).toBe(true);
  });

  it('should create artifact without image when no file is attached', async () => {
    const res = await request(app)
      .post('/api/artifacts/with-image')
      .field('name', 'Vedda Spear No Image')
      .field('description', 'A hunting spear artifact without any image attached')
      .field('category', 'weapons')
      .field('location', 'Eastern Forests, Sri Lanka')
      .field('createdBy', 'admin');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.images).toHaveLength(0);
    expect(cloudinaryHelper.uploadToCloudinary).not.toHaveBeenCalled();
  });

  it('should parse tags correctly when sent as a JSON string', async () => {
    cloudinaryHelper.uploadToCloudinary.mockResolvedValue({
      url: 'https://res.cloudinary.com/vedda/spear.jpg',
      publicId: 'vedda/spear',
    });

    const res = await request(app)
      .post('/api/artifacts/with-image')
      .field('name', 'Vedda Spear Tags Test')
      .field('description', 'A hunting spear used for testing the tags parsing logic')
      .field('category', 'weapons')
      .field('location', 'Test Location')
      .field('createdBy', 'admin')
      .field('tags', JSON.stringify(['hunting', 'forest', 'traditional']))
      .attach('image', Buffer.from('fake-image-content'), {
        filename: 'spear.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tags).toEqual(['hunting', 'forest', 'traditional']);
  });
});

// ─── POST /api/artifacts/generate-metadata ───────────────────────────────────
describe('POST /api/artifacts/generate-metadata', () => {
  it('should return AI-generated metadata for a given image URL', async () => {
    aiService.generateArtifactMetadata.mockResolvedValue({
      data: {
        name: 'Traditional Vedda Bow',
        description: 'A wooden hunting bow used by the Vedda people',
        category: 'weapons',
        tags: ['hunting', 'archery', 'wooden'],
        location: 'Central Highlands, Sri Lanka',
        culturalSignificance: 'Core hunting tool representing the Vedda way of life',
      },
    });

    const res = await request(app)
      .post('/api/artifacts/generate-metadata')
      .send({ imageUrl: 'https://res.cloudinary.com/vedda/bow.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggestedName).toBe('Traditional Vedda Bow');
    expect(res.body.data.suggestedCategory).toBe('weapons');
    expect(res.body.data.suggestedTags).toEqual(['hunting', 'archery', 'wooden']);
    expect(res.body.data.culturalSignificance).toBeDefined();
  });

  it('should return 400 when imageUrl is not provided', async () => {
    const res = await request(app).post('/api/artifacts/generate-metadata').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 500 when the AI service throws an error', async () => {
    aiService.generateArtifactMetadata.mockRejectedValue(new Error('AI service unavailable'));

    const res = await request(app)
      .post('/api/artifacts/generate-metadata')
      .send({ imageUrl: 'https://res.cloudinary.com/vedda/test.jpg' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
