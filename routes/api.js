const threadController = require('../controllers/threadController');
const replyController = require('../controllers/replyController');

module.exports = function (app) {
  app.route('/api/threads/:board')
    .post(threadController.createThread)
    .get(threadController.getThreads)
    .delete(threadController.deleteThread)
    .put(threadController.reportThread);

  app.route('/api/replies/:board')
    .post(replyController.createReply)
    .get(replyController.getThread)
    .delete(replyController.deleteReply)
    .put(replyController.reportReply);
};