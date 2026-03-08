// Set env variables before requiring any module
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock external dependencies before requiring the app
jest.mock('../src/utils/cloudinaryHelper');

const cloudinaryHelper = require('../src/utils/cloudinaryHelper');
const app = require('../src/index');
const Artifact = require('../src/models/Artifact');
const Feedback = require('../src/models/Feedback');

let mongoServer;

// ─── Token helpers ────────────────────────────────────────────────────────────
const JWT_SECRET = 'test-jwt-secret';
const userId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();

const userToken = jwt.sign(
  { userId: userId.toString(), role: 'user', username: 'testuser' },
  JWT_SECRET
);
const adminToken = jwt.sign(
  { userId: adminId.toString(), role: 'admin', username: 'admin' },
  JWT_SECRET
);

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
  await Feedback.deleteMany({});
  await Artifact.deleteMany({});
  jest.clearAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createArtifact = (overrides = {}) =>
  Artifact.create({
    name: 'Traditional Vedda Bow',
    description: 'A wooden bow crafted from naturally curved branches used for hunting',
    category: 'weapons',
    location: 'Central Highlands, Sri Lanka',
    tags: ['hunting'],
    createdBy: 'admin',
    ...overrides,
  });

const createFeedback = (artifactId, overrides = {}) =>
  Feedback.create({
    artifactId,
    userId: userId.toString(),
    username: 'testuser',
    feedbackType: 'edit_suggestion',
    suggestedChanges: { name: 'Updated Bow Name' },
    status: 'pending',
    ...overrides,
  });

// ─── POST /api/feedback (submitFeedback) ──────────────────────────────────────
describe('POST /api/feedback', () => {
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id.toString();
  });

  it('should submit feedback with suggested changes', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        artifactId,
        feedbackType: 'edit_suggestion',
        suggestedChanges: { name: 'Corrected Bow Name', description: 'Updated description text' },
        username: 'testuser',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.feedbackType).toBe('edit_suggestion');
  });

  it('should submit feedback with suggested images', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        artifactId,
        feedbackType: 'new_info',
        suggestedImages: [{ url: 'https://res.cloudinary.com/vedda/img.jpg', publicId: 'vedda/img' }],
        username: 'testuser',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggestedImages).toHaveLength(1);
  });

  it('should fall back to Anonymous username when username is not provided', async () => {
    const anonToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId().toString(), role: 'user', username: '' },
      JWT_SECRET
    );

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${anonToken}`)
      .send({
        artifactId,
        feedbackType: 'correction',
        suggestedChanges: { location: 'Updated Location' },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.username).toBeDefined();
  });

  it('should return 404 when the target artifact does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        artifactId: fakeId,
        feedbackType: 'edit_suggestion',
        suggestedChanges: { name: 'Does not matter' },
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when neither suggestedChanges nor suggestedImages are provided', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        artifactId,
        feedbackType: 'general',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ artifactId, feedbackType: 'general', suggestedChanges: { name: 'Test' } });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/feedback/upload-images ─────────────────────────────────────────
describe('POST /api/feedback/upload-images', () => {
  it('should upload feedback images and return cloudinary results', async () => {
    cloudinaryHelper.uploadToCloudinary
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/vedda/fb1.jpg', publicId: 'vedda/fb1' })
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/vedda/fb2.jpg', publicId: 'vedda/fb2' });

    const res = await request(app)
      .post('/api/feedback/upload-images')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('images', Buffer.from('fake-img-1'), { filename: 'fb1.jpg', contentType: 'image/jpeg' })
      .attach('images', Buffer.from('fake-img-2'), { filename: 'fb2.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].url).toContain('cloudinary.com');
  });

  it('should return 400 when no files are provided', async () => {
    const res = await request(app)
      .post('/api/feedback/upload-images')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 500 when cloudinary upload fails', async () => {
    cloudinaryHelper.uploadToCloudinary.mockRejectedValue(new Error('Cloudinary error'));

    const res = await request(app)
      .post('/api/feedback/upload-images')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('images', Buffer.from('fake-img'), { filename: 'fail.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/feedback (getAllFeedback) ───────────────────────────────────────
describe('GET /api/feedback', () => {
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id;

    await Feedback.create([
      { artifactId, userId: userId.toString(), username: 'user1', feedbackType: 'edit_suggestion', suggestedChanges: { name: 'Name 1' }, status: 'pending' },
      { artifactId, userId: userId.toString(), username: 'user2', feedbackType: 'new_info', suggestedChanges: { description: 'New info desc' }, status: 'approved' },
      { artifactId, userId: userId.toString(), username: 'user3', feedbackType: 'correction', suggestedChanges: { location: 'New location' }, status: 'rejected' },
    ]);
  });

  it('should return all feedback with pagination (admin)', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.feedback).toHaveLength(3);
    expect(res.body.pagination.total).toBe(3);
  });

  it('should filter feedback by status', async () => {
    const res = await request(app)
      .get('/api/feedback?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.feedback.every((f) => f.status === 'pending')).toBe(true);
    expect(res.body.feedback).toHaveLength(1);
  });

  it('should filter feedback by feedbackType', async () => {
    const res = await request(app)
      .get('/api/feedback?feedbackType=correction')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.feedback.every((f) => f.feedbackType === 'correction')).toBe(true);
  });

  it('should filter feedback by artifactId', async () => {
    const res = await request(app)
      .get(`/api/feedback?artifactId=${artifactId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.feedback.length).toBeGreaterThan(0);
  });

  it('should handle pagination with limit', async () => {
    const res = await request(app)
      .get('/api/feedback?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.feedback.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.pages).toBe(2);
  });

  it('should return 403 when a regular user tries to access all feedback', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/feedback/:id ────────────────────────────────────────────────────
describe('GET /api/feedback/:id', () => {
  let feedbackId;
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id;
    const feedback = await createFeedback(artifactId);
    feedbackId = feedback._id.toString();
  });

  it('should return the feedback document by ID (admin)', async () => {
    const res = await request(app)
      .get(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(feedbackId);
    expect(res.body.data.username).toBe('testuser');
  });

  it('should populate artifactId fields in the response', async () => {
    const res = await request(app)
      .get(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.artifactId).toBeDefined();
    expect(res.body.data.artifactId.name).toBeDefined();
  });

  it('should return 404 for a non-existent feedback ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/feedback/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 when a regular user tries to view feedback by ID', async () => {
    const res = await request(app)
      .get(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/feedback/:id/review ─────────────────────────────────────────────
describe('PUT /api/feedback/:id/review', () => {
  let artifactId;
  let feedbackId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id;
    const feedback = await createFeedback(artifactId, {
      suggestedChanges: {
        name: 'Reviewed Bow Name',
        description: 'Updated description for approved feedback test',
        location: 'Batticaloa District, Sri Lanka',
      },
    });
    feedbackId = feedback._id.toString();
  });

  it('should approve feedback and apply suggested changes to the artifact', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedbackId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved', reviewNote: 'Changes are accurate' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.reviewedAt).toBeDefined();
    expect(res.body.data.reviewNote).toBe('Changes are accurate');

    // Verify artifact was actually updated
    const updatedArtifact = await Artifact.findById(artifactId);
    expect(updatedArtifact.name).toBe('Reviewed Bow Name');
    expect(updatedArtifact.description).toBe('Updated description for approved feedback test');
  });

  it('should reject feedback without applying changes to the artifact', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedbackId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected', reviewNote: 'Not accurate enough' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');

    // Artifact should remain unchanged
    const artifact = await Artifact.findById(artifactId);
    expect(artifact.name).toBe('Traditional Vedda Bow');
  });

  it('should add suggested images to the artifact when approved', async () => {
    const feedback = await createFeedback(artifactId, {
      suggestedImages: [{ url: 'https://res.cloudinary.com/vedda/new.jpg', publicId: 'vedda/new' }],
    });

    const res = await request(app)
      .put(`/api/feedback/${feedback._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);

    const updatedArtifact = await Artifact.findById(artifactId);
    expect(updatedArtifact.images.length).toBeGreaterThan(0);
    expect(updatedArtifact.images[0].url).toBe('https://res.cloudinary.com/vedda/new.jpg');
  });

  it('should return 400 for an invalid status value', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedbackId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'maybe' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when feedback has already been reviewed', async () => {
    await Feedback.findByIdAndUpdate(feedbackId, { status: 'approved' });

    const res = await request(app)
      .put(`/api/feedback/${feedbackId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 for a non-existent feedback ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/feedback/${fakeId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 when a regular user tries to review feedback', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedbackId}/review`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
  });
});

// ─── GET /api/feedback/my ─────────────────────────────────────────────────────
describe('GET /api/feedback/my', () => {
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id;

    // Create two feedbacks owned by userId and one by a different user
    const otherId = new mongoose.Types.ObjectId().toString();
    await Feedback.create([
      { artifactId, userId: userId.toString(), username: 'testuser', feedbackType: 'edit_suggestion', suggestedChanges: { name: 'Edit 1' } },
      { artifactId, userId: userId.toString(), username: 'testuser', feedbackType: 'correction', suggestedChanges: { location: 'New loc' } },
      { artifactId, userId: otherId, username: 'other', feedbackType: 'new_info', suggestedChanges: { description: 'Other desc' } },
    ]);
  });

  it("should return only the current user's own feedback", async () => {
    const res = await request(app)
      .get('/api/feedback/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.feedback).toHaveLength(2);
    expect(res.body.feedback.every((f) => f.userId === userId.toString())).toBe(true);
  });

  it("should paginate the user's own feedback", async () => {
    const res = await request(app)
      .get('/api/feedback/my?page=1&limit=1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.feedback).toHaveLength(1);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.pages).toBe(2);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/feedback/my');

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/feedback/stats ──────────────────────────────────────────────────
describe('GET /api/feedback/stats', () => {
  let artifactId;

  beforeEach(async () => {
    const artifact = await createArtifact();
    artifactId = artifact._id;

    await Feedback.create([
      { artifactId, userId: userId.toString(), username: 'u1', feedbackType: 'edit_suggestion', suggestedChanges: { name: 'A' }, status: 'pending' },
      { artifactId, userId: userId.toString(), username: 'u2', feedbackType: 'edit_suggestion', suggestedChanges: { name: 'B' }, status: 'approved' },
      { artifactId, userId: userId.toString(), username: 'u3', feedbackType: 'correction', suggestedChanges: { location: 'C' }, status: 'rejected' },
      { artifactId, userId: userId.toString(), username: 'u4', feedbackType: 'new_info', suggestedChanges: { description: 'D' }, status: 'pending' },
    ]);
  });

  it('should return correct counts by status', async () => {
    const res = await request(app)
      .get('/api/feedback/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(4);
    expect(res.body.data.byStatus.pending).toBe(2);
    expect(res.body.data.byStatus.approved).toBe(1);
    expect(res.body.data.byStatus.rejected).toBe(1);
  });

  it('should return correct counts by feedback type', async () => {
    const res = await request(app)
      .get('/api/feedback/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.byType.edit_suggestion).toBe(2);
    expect(res.body.data.byType.correction).toBe(1);
    expect(res.body.data.byType.new_info).toBe(1);
  });

  it('should include recentWeek count', async () => {
    const res = await request(app)
      .get('/api/feedback/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    // All created feedback are within the last 7 days
    expect(res.body.data.recentWeek).toBe(4);
  });

  it('should return 403 when a regular user requests stats', async () => {
    const res = await request(app)
      .get('/api/feedback/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});
