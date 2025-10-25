import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthEndpoint() {
  log('\n=== Testing Health Endpoint ===', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log('Health check passed!', 'green');
    console.log('Status:', response.data.status);
    console.log('Services:', JSON.stringify(response.data.services, null, 2));
    return true;
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testCaptionGeneration() {
  log('\n=== Testing Caption Generation ===', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/generate/caption`, {
      imageContext: 'A futuristic AI-powered workspace with holographic displays',
      tone: 'professional',
    });

    if (response.data.success) {
      log('Caption generation passed!', 'green');
      console.log('Generated Caption:', response.data.caption);
      if (response.data.usedFallback) {
        log('Note: Used fallback service', 'yellow');
      }
      return true;
    } else {
      log('Caption generation failed: No success flag', 'red');
      return false;
    }
  } catch (error) {
    log(`Caption generation failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testImageGeneration() {
  log('\n=== Testing Image Generation ===', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/generate/image`, {
      prompt: 'A stunning abstract representation of AI and creativity merging, vibrant colors, digital art',
      options: {
        width: 1024,
        height: 1024,
        num_images: 1,
      },
    });

    if (response.data.success) {
      log('Image generation initiated successfully!', 'green');
      console.log('Generation ID:', response.data.generationId);
      return true;
    } else {
      log('Image generation failed: No success flag', 'red');
      return false;
    }
  } catch (error) {
    log(`Image generation failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testVideoGeneration() {
  log('\n=== Testing Video Generation ===', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/generate/video`, {
      prompt: 'A cinematic journey through the future of AI technology',
      options: {
        duration: 5,
      },
    });

    if (response.data.success) {
      log('Video generation request accepted!', 'green');
      console.log('Message:', response.data.message);
      return true;
    } else {
      log('Video generation failed: No success flag', 'red');
      return false;
    }
  } catch (error) {
    log(`Video generation failed: ${error.message}`, 'red');
    return false;
  }
}

async function testFullOrchestration() {
  log('\n=== Testing Full AI Pipeline Orchestration ===', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/orchestrate`, {
      generateImage: true,
      imagePrompt: 'A professional tech entrepreneur presenting at a conference, modern aesthetic',
      imageOptions: {
        width: 1024,
        height: 1024,
      },
      generateCaption: true,
      captionContext: 'Empowering the future of AI-driven business automation',
      tone: 'inspirational',
      logicTask: 'Determine the best time to post this content for maximum LinkedIn engagement',
      logicContext: {
        targetAudience: 'Tech entrepreneurs and AI enthusiasts',
        timezone: 'PST',
      },
      postToLinkedIn: false, // Set to true when LinkedIn credentials are configured
    });

    if (response.data.status === 'completed') {
      log('Full orchestration completed successfully!', 'green');
      console.log('Task ID:', response.data.taskId);
      console.log('Results:', JSON.stringify(response.data.results, null, 2));
      return true;
    } else if (response.data.status === 'failed') {
      log(`Orchestration failed: ${response.data.error}`, 'red');
      return false;
    } else {
      log('Orchestration in progress...', 'yellow');
      return true;
    }
  } catch (error) {
    log(`Full orchestration failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function runAllTests() {
  log('\n========================================', 'blue');
  log('   MCP ORCHESTRATION SYSTEM TEST SUITE   ', 'blue');
  log('========================================\n', 'blue');

  const results = {
    health: false,
    caption: false,
    image: false,
    video: false,
    orchestration: false,
  };

  // Run tests
  results.health = await testHealthEndpoint();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests

  results.caption = await testCaptionGeneration();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.image = await testImageGeneration();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.video = await testVideoGeneration();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.orchestration = await testFullOrchestration();

  // Summary
  log('\n========================================', 'blue');
  log('           TEST RESULTS SUMMARY          ', 'blue');
  log('========================================\n', 'blue');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? 'PASSED' : 'FAILED';
    const color = result ? 'green' : 'red';
    log(`${test.toUpperCase()}: ${status}`, color);
  });

  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\nAll tests passed! Your MCP system is ready for deployment.', 'green');
  } else {
    log('\nSome tests failed. Please check the logs above for details.', 'yellow');
  }

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\nTest suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
