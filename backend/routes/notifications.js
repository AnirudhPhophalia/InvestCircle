import { Router } from 'express'
import db from '../db.js'
import { requireAuth, optionalAuth } from '../auth.js'

const router = Router()

// Helper exported for other routes to trigger notifications
export async function createNotification({ userId = null, actorId = null, type, title, message, link = null }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, message, link, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
       RETURNING *`,
      [userId, actorId, type, title, message, link]
    )
    return rows[0]
  } catch (err) {
    console.error('Failed to create notification:', err.message)
    return null
  }
}

// GET /api/notifications
router.get('/', optionalAuth, async (req, res) => {
  try {
    let rows = []
    if (req.userId) {
      const result = await db.query(
        `SELECT n.*, u.display_name AS actor_name, u.handle AS actor_handle, u.avatar AS actor_avatar
         FROM notifications n
         LEFT JOIN users u ON u.id = n.actor_id
         WHERE n.user_id = $1 OR n.user_id IS NULL
         ORDER BY n.created_at DESC
         LIMIT 40`,
        [req.userId]
      )
      rows = result.rows
    } else {
      const result = await db.query(
        `SELECT n.*, u.display_name AS actor_name, u.handle AS actor_handle, u.avatar AS actor_avatar
         FROM notifications n
         LEFT JOIN users u ON u.id = n.actor_id
         WHERE n.user_id IS NULL
         ORDER BY n.created_at DESC
         LIMIT 20`
      )
      rows = result.rows
    }

    const unreadCount = rows.filter((r) => !r.read).length
    res.json({ notifications: rows, unreadCount })
  } catch (err) {
    console.error('Error fetching notifications:', err)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// POST /api/notifications (Create / broadcast a live notification)
router.post('/', requireAuth, async (req, res) => {
  const { title, message, type = 'market_alert', link = '/discussions', isGlobal = true } = req.body

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' })
  }

  try {
    const notification = await createNotification({
      userId: isGlobal ? null : req.userId,
      actorId: req.userId,
      type,
      title: title.trim(),
      message: message.trim(),
      link,
    })

    res.status(201).json(notification)
  } catch (err) {
    console.error('Error posting notification:', err)
    res.status(500).json({ error: 'Failed to post notification' })
  }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET read = true WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [req.params.id, req.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' })
  }
})

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET read = true WHERE user_id = $1 OR user_id IS NULL`,
      [req.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

// POST /api/notifications/simulate (Quick simulation of live market alerts)
router.post('/simulate', optionalAuth, async (req, res) => {
  const SIMULATED_ALERTS = [
    {
      type: 'market_alert',
      title: '🚨 NVIDIA (NVDA) Spikes +4.8%',
      message: 'Surges following breakthrough reports in next-generation AI accelerator demand.',
      link: '/discussions',
    },
    {
      type: 'market_alert',
      title: '📈 TCS Q3 Outperformance',
      message: 'Management signals strong BFSI order pipeline expansion of $8.1B.',
      link: '/discussions',
    },
    {
      type: 'accuracy_call',
      title: '🎯 Accuracy Engine Resolution',
      message: 'Your bullish call on semiconductor breakout was verified as a HIT!',
      link: '/profile',
    },
    {
      type: 'market_alert',
      title: '⚡ Federal Reserve Rate Announcement',
      message: 'Chair signals interest rate stabilization, banking and tech yields rally.',
      link: '/news',
    },
    {
      type: 'broadcast',
      title: '📢 Community Milestone',
      message: 'Over 500 verified investment discussions posted on InvestCircle this week.',
      link: '/discussions',
    },
  ]

  const randomAlert = SIMULATED_ALERTS[Math.floor(Math.random() * SIMULATED_ALERTS.length)]
  const notification = await createNotification({
    userId: null,
    actorId: req.userId || null,
    type: randomAlert.type,
    title: randomAlert.title,
    message: randomAlert.message,
    link: randomAlert.link,
  })

  res.status(201).json(notification)
})

export default router

