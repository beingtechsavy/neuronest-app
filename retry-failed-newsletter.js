const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Failed emails from previous run
const FAILED_EMAILS = [
  'saisarthak.ai@gmail.com',
  'soni34191@gmail.com',
  'mkpathy154@gmail.com',
  '18866royson@gmail.com',
  'sesadi0501@gmail.com',
  'gouravjena92@gmainl.com'
];

async function sendNewsletterEmail(email, username) {
  const emailContent = {
    from: 'NeuroNest <noreply@neuronest.work>',
    to: email,
    subject: '🧠 Why NeuroNest Exists: A Letter About ADHD, Overwhelm, and Hope',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #6366f1;
      font-size: 28px;
      margin-bottom: 10px;
    }
    h2 {
      color: #4f46e5;
      font-size: 22px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .highlight {
      background-color: #eef2ff;
      border-left: 4px solid #6366f1;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .story {
      font-style: italic;
      color: #555;
      margin: 20px 0;
      padding: 15px;
      background-color: #fef3c7;
      border-radius: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .signature {
      margin-top: 30px;
      font-style: italic;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 Why NeuroNest Exists</h1>
    <p style="font-size: 16px; color: #6b7280;">A letter about ADHD, overwhelm, and hope</p>
    
    <p>Hey ${username || 'there'},</p>
    
    <p>I want to tell you a story. It's probably your story too.</p>
    
    <div class="story">
      <strong>It's 11:47 PM on a Sunday night.</strong><br><br>
      
      A 16-year-old sits at his desk, staring at a blank document. The assignment was given two weeks ago. He remembers the moment clearly—he even wrote it down. But somehow, between the excitement of a new idea, the distraction of a YouTube video, and the overwhelming feeling of "I'll do it tomorrow," here he is.<br><br>
      
      Again.<br><br>
      
      His mom knocks on the door: "Are you done yet?"<br><br>
      
      The panic sets in. Not because he doesn't care. Not because he's lazy. But because his brain works differently, and the world wasn't built for minds like his.
    </div>
    
    <h2>This Is Why NeuroNest Exists</h2>
    
    <p>If you have ADHD, you know this feeling intimately:</p>
    
    <ul>
      <li><strong>The Avalanche Effect:</strong> One big task feels like climbing Everest, so you freeze instead of starting</li>
      <li><strong>The Time Blindness:</strong> "I have plenty of time" suddenly becomes "Oh no, it's due tomorrow"</li>
      <li><strong>The Motivation Paradox:</strong> You can hyperfocus for 6 hours on something you love, but can't start a 10-minute task you need to do</li>
      <li><strong>The Planning Paralysis:</strong> You spend more time organizing your to-do list than actually doing the tasks</li>
    </ul>
    
    <div class="highlight">
      <strong>Here's the truth:</strong> Traditional productivity tools were built for neurotypical brains. They assume you can "just start," "just focus," and "just remember." But ADHD brains need something different—something that works <em>with</em> how you think, not against it.
    </div>
    
    <h2>How NeuroNest Is Different</h2>
    
    <p><strong>1. We Break Down the Mountain</strong></p>
    <p>Remember that overwhelming assignment? NeuroNest's AI doesn't just remind you about it—it breaks it into bite-sized, manageable steps. Instead of "Write 10-page research paper," you get:</p>
    <ul>
      <li>✅ Choose topic (10 min)</li>
      <li>✅ Find 3 sources (15 min)</li>
      <li>✅ Write introduction paragraph (20 min)</li>
    </ul>
    <p>Suddenly, Everest becomes a series of small hills you can actually climb.</p>
    
    <p><strong>2. We Make Time Visible</strong></p>
    <p>Time blindness is real. NeuroNest shows you exactly when things are due, how long they'll take, and automatically schedules them around your life—sleep, meals, and all. No more "I thought I had time."</p>
    
    <p><strong>3. We Celebrate Small Wins</strong></p>
    <p>ADHD brains crave dopamine. Every completed step, every focus session, every streak—we celebrate it. Because progress isn't just about the finish line; it's about every single step forward.</p>
    
    <p><strong>4. We Reduce Decision Fatigue</strong></p>
    <p>Should I work on math or history? Morning or evening? 30 minutes or 2 hours? These micro-decisions drain your mental energy. NeuroNest makes them for you, so you can save your brainpower for what actually matters.</p>
    
    <div class="story">
      <strong>Imagine this instead:</strong><br><br>
      
      It's Sunday afternoon. You open NeuroNest and see your assignment broken into 8 small tasks. The first one says: "Brainstorm 5 topic ideas - 10 minutes."<br><br>
      
      You think, "I can do 10 minutes."<br><br>
      
      You start. The timer ticks. You finish. A little celebration animation plays. Dopamine hits.<br><br>
      
      "One more?" you think.<br><br>
      
      Before you know it, you've completed 4 tasks. It's only 3 PM. You're not panicking at midnight. You're not disappointing yourself again.<br><br>
      
      You're winning.
    </div>
    
    <h2>Why This Matters So Much</h2>
    
    <p>Living with ADHD isn't just about missed deadlines and forgotten tasks. It's about:</p>
    
    <ul>
      <li>The shame of letting people down—again</li>
      <li>The exhaustion of working twice as hard to achieve the same results</li>
      <li>The frustration of knowing you're capable but feeling stuck</li>
      <li>The loneliness of thinking "Why can't I just be normal?"</li>
    </ul>
    
    <div class="highlight">
      <strong>You ARE normal.</strong> Your brain is wired differently, and that's not a flaw—it's a feature. You're creative, passionate, innovative, and capable of incredible things. You just need tools that work the way you work.
    </div>
    
    <h2>Our Promise to You</h2>
    
    <p>NeuroNest isn't just another productivity app. It's a commitment to making your life easier, your goals achievable, and your potential unlimited. We're building every feature with ADHD brains in mind because we understand:</p>
    
    <ul>
      <li>You need structure, but not rigidity</li>
      <li>You need reminders, but not nagging</li>
      <li>You need challenges, but not overwhelm</li>
      <li>You need support, but not judgment</li>
    </ul>
    
    <p>Every line of code we write, every feature we build, every decision we make starts with one question: <strong>"Will this make life easier for someone with ADHD?"</strong></p>
    
    <p>If the answer isn't a resounding yes, we don't build it.</p>
    
    <h2>You're Not Alone</h2>
    
    <p>There are millions of people who understand exactly what you're going through. The late-night panic. The forgotten commitments. The feeling of being overwhelmed by simple tasks.</p>
    
    <p>But here's what else they understand: <strong>You are capable of amazing things.</strong></p>
    
    <p>You just need the right support system. And that's exactly what we're building together.</p>
    
    <div class="highlight">
      <p style="margin: 0;"><strong>So here's to no more midnight panic sessions.</strong></p>
      <p style="margin: 10px 0 0 0;">Here's to breaking down mountains into manageable steps. Here's to celebrating every small win. Here's to building a life that works with your brain, not against it.</p>
    </div>
    
    <div class="signature">
      <p>With understanding and hope,</p>
      <p><strong>The NeuroNest Team</strong></p>
      <p style="font-size: 14px; margin-top: 10px;">P.S. - We're constantly improving NeuroNest based on your feedback. If you have ideas, struggles, or stories to share, hit reply. We read every single message.</p>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you're part of the NeuroNest community.</p>
      <p>NeuroNest - Built for ADHD brains, by people who understand</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailContent),
  });

  return response.json();
}

async function retryFailedEmails() {
  console.log('🔄 Retrying failed emails...\n');
  console.log(`📊 ${FAILED_EMAILS.length} emails to retry\n`);

  let successCount = 0;
  let failCount = 0;

  for (const email of FAILED_EMAILS) {
    try {
      console.log(`📧 Sending to ${email}...`);
      const result = await sendNewsletterEmail(email, 'User');
      
      if (result.id) {
        console.log(`   ✅ Success! ID: ${result.id}\n`);
        successCount++;
      } else {
        console.log(`   ❌ Failed:`, result, '\n');
        failCount++;
      }

      // Wait 1 second between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Error:`, error.message, '\n');
      failCount++;
    }
  }

  console.log('📈 Retry Summary:');
  console.log(`✅ Successfully sent: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
}

retryFailedEmails();
