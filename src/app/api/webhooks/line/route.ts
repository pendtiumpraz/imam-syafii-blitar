import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { handleModeTextMessage, handleModePostback } from '@/lib/line/handlers/ModeHandler'
import { handleImageMessage } from '@/lib/line/handlers/image'
import { 
  handleFollowEvent,
  handleUnfollowEvent 
} from '@/lib/line/handlers'
import { validateSignature } from '@/lib/line/security'
import { LineEvent } from '@/types/line'

// Initialize LINE settings on startup
let lineSettings: any = null

async function getLineSettings() {
  if (!lineSettings) {
    lineSettings = await prisma.line_settings.findFirst()
  }
  return lineSettings
}

// GET: LINE webhook verification
export async function GET(request: NextRequest) {
  // LINE will send a verification request when setting up webhook
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

// POST: LINE webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')
    
    // Try to get settings from database, fallback to env vars
    let channelSecret = process.env.LINE_CHANNEL_SECRET
    let channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    
    try {
      const settings = await getLineSettings()
      if (settings && settings.enabled) {
        channelSecret = settings.channelSecret || channelSecret
        channelAccessToken = settings.channelAccessToken || channelAccessToken
      }
    } catch (dbError) {
      // If database is not available, use env vars
      console.log('Using env vars for LINE config (database not available)')
    }
    
    // Check if we have the required config
    if (!channelSecret || !channelAccessToken) {
      console.error('LINE webhook config missing')
      // Return 200 to prevent LINE from retrying
      return NextResponse.json({ error: 'Config missing' }, { status: 200 })
    }
    
    // Validate signature if provided
    if (signature && !validateSignature(body, channelSecret, signature)) {
      console.error('Invalid LINE signature')
      // Return 200 to prevent LINE from retrying
      return NextResponse.json({ error: 'Invalid signature' }, { status: 200 })
    }
    
    // Update env for LINE client
    if (channelAccessToken) {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = channelAccessToken
    }

    const data = JSON.parse(body)
    const events: LineEvent[] = data.events || []
    
    console.log('LINE webhook received:', {
      eventsCount: events.length,
      events: events.map(e => ({
        type: e.type,
        message: e.message?.text,
        userId: e.source?.userId
      }))
    })

    // Process each event
    for (const event of events) {
      try {
        console.log('Processing event:', event.type, event.message?.text)
        
        // Store user info if not exists
        if (event.source?.userId) {
          await storeUserInfo(event.source.userId)
        }

        // Handle different event types
        switch (event.type) {
          case 'message':
            if (event.message?.type === 'text') {
              console.log('Handling text message:', event.message.text)
              await handleModeTextMessage(event)
            } else if (event.message?.type === 'image') {
              console.log('Handling image message')
              await handleImageMessage(event)
            }
            break
            
          case 'postback':
            console.log('Handling postback:', event.postback?.data)
            await handleModePostback(event)
            break
            
          case 'follow':
            await handleFollowEvent(event)
            break
            
          case 'unfollow':
            await handleUnfollowEvent(event)
            break
        }
      } catch (error) {
        console.error('Error processing event:', error)
      }
    }

    // LINE requires exactly 200 status code
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    // Even on error, LINE prefers 200 status to avoid retries
    return NextResponse.json({ error: 'Internal server error' }, { status: 200 })
  }
}

// Store or update LINE user information
async function storeUserInfo(userId: string) {
  try {
    const profile = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      }
    }).then(res => res.json())

    await prisma.line_users.upsert({
      where: { userId },
      update: {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
        lastActive: new Date()
      },
      create: {
        userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      }
    })
  } catch (error) {
    console.error('Error storing user info:', error)
  }
}