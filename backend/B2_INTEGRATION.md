B2 integration plan:
- use @aws-sdk/client-s3 with B2 endpoint
- if B2 enabled, upload buffer to B2 and return public URL
- update imageUpload.js to support B2
- add env vars to render.yaml and .env.example
- keep Cloudinary fallback logic or replace; prefer B2 for file uploads
