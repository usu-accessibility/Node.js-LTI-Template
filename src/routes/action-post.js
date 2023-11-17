const router = require('express').Router();
const mondayController = require('../controllers/monday-controller');

router.post('/monday/execute_action', mondayController.executeAction);
router.post('/monday/get_remote_list_options', mondayController.getRemoteListOptions);
router.post('/monday/check_caption', mondayController.checkCaption);

module.exports = router;
