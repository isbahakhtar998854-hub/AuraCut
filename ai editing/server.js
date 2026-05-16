const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/edit-image', upload.fields([{ name: 'image' }, { name: 'mask' }]), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageFile = req.files['image'][0];
    const maskFile = req.files['mask'][0];

    const formData = new FormData();
    formData.append('image', fs.createReadStream(imageFile.path));
    formData.append('mask', fs.createReadStream(maskFile.path));
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');

    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/edit/inpaint',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          Accept: 'image/*',
        },
        responseType: 'arraybuffer',
      }
    );

    fs.unlinkSync(imageFile.path);
    fs.unlinkSync(maskFile.path);

    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    res.json({ success: true, image: `data:image/png;base64,${base64Image}` });

  } catch (error) {
    res.status(500).json({ success: false, error: 'AI processing failed.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));