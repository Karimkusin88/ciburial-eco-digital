import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
<<<<<<< HEAD
    sitemap: 'https://ciburial.my.id/sitemap.xml',
    host: 'https://ciburial.my.id',
=======
    sitemap: 'https://www.ciburial.my.id/sitemap.xml',
    host: 'https://www.ciburial.my.id',
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
  }
}
