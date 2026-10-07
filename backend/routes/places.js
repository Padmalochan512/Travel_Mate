const express = require('express');
const router = express.Router();
const {
    getNearbyPlaces,
    getSmartFeed,
    getPlace,
    getAllPlaces,
    createPlace,
    updatePlace,
    deletePlace,
    getNearbyAttractions,
    getCategories
} = require('../controllers/placeController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/nearby', getNearbyPlaces);
router.get('/feed', getSmartFeed);
router.get('/categories', getCategories);
router.get('/:id/nearby', getNearbyAttractions);
router.get('/:id', getPlace);
router.get('/', getAllPlaces);

// Create place (accessible to users / guests)
router.post('/', optionalAuth, createPlace);

// Admin routes for updating and deleting
router.put('/:id', protect, authorize('admin'), updatePlace);
router.delete('/:id', protect, authorize('admin'), deletePlace);

module.exports = router;