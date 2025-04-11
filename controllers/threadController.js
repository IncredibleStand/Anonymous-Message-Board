const Thread = require('../models/Thread');

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;
  if (!text || !delete_password) {
    return res.status(400).send('Text and delete_password are required');
  }
  try {
    const thread = new Thread({
      board,
      text,
      delete_password,
    });
    await thread.save();
    res.redirect(`/b/${board}/`);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getThreads = async (req, res) => {
  const { board } = req.params;
  try {
    const threads = await Thread.find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .select('-delete_password -reported')
      .lean();
    threads.forEach((thread) => {
      thread.replies = thread.replies
        .sort((a, b) => b.created_on - a.created_on)
        .slice(0, 3)
        .map((reply) => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on,
        }));
    });
    res.json(threads);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.deleteThread = async (req, res) => {
  const { thread_id, delete_password } = req.body;
  if (!thread_id || !delete_password) {
    return res.status(400).send('thread_id and delete_password are required');
  }
  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('Thread not found');
    if (thread.delete_password !== delete_password) {
      return res.send('incorrect password');
    }
    await Thread.deleteOne({ _id: thread_id });
    res.send('success');
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.reportThread = async (req, res) => {
  const { thread_id } = req.body;
  if (!thread_id) {
    return res.status(400).send('thread_id is required');
  }
  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('Thread not found');
    thread.reported = true;
    await thread.save();
    res.send('reported');
  } catch (err) {
    res.status(500).send('Server error');
  }
};