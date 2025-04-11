const Thread = require('../models/Thread');

exports.createReply = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password, thread_id } = req.body;
  if (!text || !delete_password || !thread_id) {
    return res.status(400).send('text, delete_password, and thread_id are required');
  }
  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('Thread not found');
    thread.replies.push({ text, delete_password });
    thread.bumped_on = new Date();
    await thread.save();
    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getThread = async (req, res) => {
  const { thread_id } = req.query;
  if (!thread_id) {
    return res.status(400).send('thread_id is required');
  }
  try {
    const thread = await Thread.findById(thread_id)
      .select('-delete_password -reported')
      .lean();
    if (!thread) return res.status(404).send('Thread not found');
    thread.replies = thread.replies.map((reply) => ({
      _id: reply._id,
      text: reply.text,
      created_on: reply.created_on,
    }));
    res.json(thread);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.deleteReply = async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;
  if (!thread_id || !reply_id || !delete_password) {
    return res.status(400).send('thread_id, reply_id, and delete_password are required');
  }
  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('Thread not found');
    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('Reply not found');
    if (reply.delete_password !== delete_password) {
      return res.send('incorrect password');
    }
    reply.text = '[deleted]'; // Update text instead of removing
    await thread.save();
    res.send('success');
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.reportReply = async (req, res) => {
  const { thread_id, reply_id } = req.body;
  if (!thread_id || !reply_id) {
    console.log('Missing thread_id or reply_id:', { thread_id, reply_id });
    return res.status(400).send('thread_id and reply_id are required');
  }
  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) {
      console.log('Thread not found:', thread_id);
      return res.status(404).send('Thread not found');
    }
    const reply = thread.replies.id(reply_id);
    if (!reply) {
      console.log('Reply not found:', reply_id);
      return res.status(404).send('Reply not found');
    }
    reply.reported = true;
    await thread.save();
    res.send('reported');
  } catch (err) {
    console.error('Error reporting reply:', err);
    res.status(500).send('Server error');
  }
};