// Mock Subscriptions API Endpoints
// In a real implementation, these would connect to Supabase

const express = require('express');
const router = express.Router();
const { subscriptions } = require('./db');
const { authenticateToken } = require('./authMiddleware');

// Get subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const subscription = subscriptions.find(sub => sub.user_id === req.userId);

    if (!subscription) {
      return res.json({ success: true, subscription: null });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        user_id: subscription.user_id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Create subscription (mock payment processing)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const existingSubscription = subscriptions.find(
      sub => sub.user_id === req.userId && sub.status === 'active'
    );

    if (existingSubscription) {
      return res.status(400).json({ success: false, message: 'لديك اشتراك فعال بالفعل' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    const newSubscription = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: req.userId,
      stripe_subscription_id: `sub_mock_${Math.random().toString(36).substr(2, 9)}`,
      stripe_customer_id: `cus_mock_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    subscriptions.push(newSubscription);

    res.json({
      success: true,
      subscription: {
        id: newSubscription.id,
        status: newSubscription.status,
        current_period_start: newSubscription.current_period_start,
        current_period_end: newSubscription.current_period_end
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Cancel subscription
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const subscriptionIndex = subscriptions.findIndex(
      sub => sub.user_id === req.userId && sub.status === 'active'
    );

    if (subscriptionIndex === -1) {
      return res.status(404).json({ success: false, message: 'لا يوجد اشتراك فعال للإلغاء' });
    }

    subscriptions[subscriptionIndex].cancel_at_period_end = true;
    subscriptions[subscriptionIndex].updated_at = new Date().toISOString();

    res.json({ success: true, message: 'تم تحديد الاشتراك للإلغاء في نهاية الفترة الحالية' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

module.exports = router;
