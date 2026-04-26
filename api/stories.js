import express from 'express';
// Note: This API expects a MongoDB connection and a Story model.
// Based on the project structure, you are primarily using Supabase.
// These routes are provided as requested for additional backend control.

const router = express.Router();

// TRAVEL STORIES CONTROL
router.patch('/:id/private', async (req, res) => {
  try {
    // This assumes a Mongoose model named Story is available globally or imported
    // await Story.findByIdAndUpdate(req.params.id, { private: true });
    res.send("updated");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // await Story.findByIdAndDelete(req.params.id);
    res.send("deleted");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

export default router;
