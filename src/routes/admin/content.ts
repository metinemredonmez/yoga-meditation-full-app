import { Router } from 'express';
import * as contentController from '../../controllers/admin/contentController';

const router = Router();

// Content stats
router.get('/stats', contentController.getContentStats);

// Programs
router.get('/programs', contentController.getPrograms);
router.post('/programs', contentController.createProgram);
router.get('/programs/:id', contentController.getProgramDetails);
router.put('/programs/:id', contentController.updateProgram);
router.delete('/programs/:id', contentController.deleteProgram);
router.post('/programs/:id/publish', contentController.publishProgram);
router.post('/programs/:id/unpublish', contentController.unpublishProgram);

// Classes
router.get('/classes', contentController.getClasses);
router.post('/classes', contentController.createClass);
router.get('/classes/:id', contentController.getClassDetails);
router.put('/classes/:id', contentController.updateClass);
router.delete('/classes/:id', contentController.deleteClass);

// Poses
router.get('/poses', contentController.getPoses);
router.post('/poses', contentController.createPose);
router.get('/poses/:id', contentController.getPoseDetails);
router.put('/poses/:id', contentController.updatePose);
router.delete('/poses/:id', contentController.deletePose);

// Challenges
router.get('/challenges', contentController.getChallenges);
router.post('/challenges', contentController.createChallenge);
router.get('/challenges/:id', contentController.getChallengeDetails);
router.put('/challenges/:id', contentController.updateChallenge);
router.delete('/challenges/:id', contentController.deleteChallenge);

export default router;
