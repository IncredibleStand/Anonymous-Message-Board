const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(5000);
  let threadId;
  let replyId;
  const board = 'test';
  const password = 'testpass';

  test('Creating a new thread: POST /api/threads/{board}', function (done) {
    chai
      .request(server)
      .post(`/api/threads/${board}`)
      .send({
        text: 'Test thread',
        delete_password: password,
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isTrue(res.redirects.length > 0);
        chai
          .request(server)
          .get(`/api/threads/${board}`)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].text, 'Test thread');
            threadId = res.body[0]._id;
            done();
          });
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET /api/threads/{board}', function (done) {
    chai
      .request(server)
      .get(`/api/threads/${board}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        assert.notProperty(res.body[0], 'delete_password');
        assert.notProperty(res.body[0], 'reported');
        if (res.body[0].replies.length > 0) {
          assert.isAtMost(res.body[0].replies.length, 3);
          assert.notProperty(res.body[0].replies[0], 'delete_password');
          assert.notProperty(res.body[0].replies[0], 'reported');
        }
        done();
      });
  });

  test('Creating a new reply: POST /api/replies/{board}', function (done) {
    chai
      .request(server)
      .post(`/api/replies/${board}`)
      .send({
        thread_id: threadId,
        text: 'Test reply',
        delete_password: password,
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isTrue(res.redirects.length > 0);
        chai
          .request(server)
          .get(`/api/replies/${board}`)
          .query({ thread_id: threadId })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body.replies);
            assert.equal(res.body.replies[0].text, 'Test reply');
            replyId = res.body.replies[0]._id;
            done();
          });
      });
  });

  test('Viewing a single thread with all replies: GET /api/replies/{board}', function (done) {
    chai
      .request(server)
      .get(`/api/replies/${board}`)
      .query({ thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'text');
        assert.isArray(res.body.replies);
        assert.equal(res.body.replies[0].text, 'Test reply');
        assert.notProperty(res.body, 'delete_password');
        assert.notProperty(res.body, 'reported');
        assert.notProperty(res.body.replies[0], 'delete_password');
        assert.notProperty(res.body.replies[0], 'reported');
        done();
      });
  });

  test('Reporting a thread: PUT /api/threads/{board}', function (done) {
    chai
      .request(server)
      .put(`/api/threads/${board}`)
      .send({ thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Reporting a reply: PUT /api/replies/{board}', function (done) {
    chai
      .request(server)
      .put(`/api/replies/${board}`)
      .send({ thread_id: threadId, reply_id: replyId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Deleting a reply with the incorrect password: DELETE /api/replies/{board}', function (done) {
    chai
      .request(server)
      .delete(`/api/replies/${board}`)
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: 'wrongpass',
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a reply with the correct password: DELETE /api/replies/{board}', function (done) {
    chai
      .request(server)
      .delete(`/api/replies/${board}`)
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: password,
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  test('Deleting a thread with the incorrect password: DELETE /api/threads/{board}', function (done) {
    chai
      .request(server)
      .delete(`/api/threads/${board}`)
      .send({
        thread_id: threadId,
        delete_password: 'wrongpass',
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a thread with the correct password: DELETE /api/threads/{board}', function (done) {
    chai
      .request(server)
      .delete(`/api/threads/${board}`)
      .send({
        thread_id: threadId,
        delete_password: password,
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });
});