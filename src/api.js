const express = require('express');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');

require('dotenv').config();

const app = express();
const router = express.Router();
const jsonParser = bodyParser.json();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/login', jsonParser, async (req, res) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: req.body.email,
    password: req.body.password,
  });

  if (error) {
    console.error(error);
    res.status(401).json({ error: error.message });
  } else {
    res.json(data);
  }
});

// API endpoint to fetch data from the Supabase table
router.get('/api/data', async (req, res) => {
  const sessionData = await supabase.auth.getSession();

  if (!sessionData.data.session) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('location_requests')
      .select('*');
    if (error) {
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to insert data into the Supabase table
router.post('/api/data', jsonParser, async (req, res) => {
  const sessionData = await supabase.auth.getSession();

  if (!sessionData.data.session) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  try {
    const { data, error } = await supabase.from('location').insert({
      ...req.body,
      security: req.body.security || null,
      user_added: true,
      reviewer: sessionData.data.session.user.id,
    });
    if (error) {
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/data/:id', jsonParser, async (req, res) => {
  const sessionData = await supabase.auth.getSession();

  if (!sessionData.data.session) {
    res.status(401).json({ error: 'Not logged in' });
    return null;
  }

  delete req.body.id;
  delete req.body.latlon;
  try {
    const { data, error } = await supabase
      .from('location')
      .update({
        ...req.body,
        security: req.body.security || null,
        user_added: true,
        reviewer: sessionData.data.session.user.id,
      })
      .eq('id', req.params.id);
    if (error) {
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// API get location from id
router.get('/api/location/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('location')
      .select('*')
      .eq('id', req.params.id);
    if (error) {
      console.log(error);
      throw error;
    }
    res.json(data[0]);
  } catch (error) {
    res.statusMessage = error.message;
    res.status(500);
  }
});

router.delete('/api/location/:id', async (req, res) => {
  const sessionData = await supabase.auth.getSession();

  if (!sessionData.data.session) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('location_requests')
      .delete()
      .eq('id', req.params.id);
    if (error) {
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
