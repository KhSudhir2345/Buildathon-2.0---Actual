const express = require('express');
const router = express.Router();
const {
  discoverProfiles,
  swipeProfile,
  getMatches,
  updateProfile,
  rateUser,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/discover', discoverProfiles);
router.post('/swipe', swipeProfile);
router.get('/matches', getMatches);
router.put('/me', updateProfile);
router.post('/:userId/rate', rateUser);

module.exports = router;
