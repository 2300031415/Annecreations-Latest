// types/express/index.d.ts
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      rawBody: Buffer;
      customer?: {
        id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        isAdmin?: boolean;
      };
      admin?: {
        id: string;
        username?: string;
        name?: string;
        email: string;
        isAdmin: boolean;
      };
      files?:
        | {
            [fieldname: string]: Express.Multer.File[];
          }
        | Express.Multer.File[];
      deviceType?: string;
      clientSource?: 'mobile' | 'web';
    }
  }
}
declare global {
  namespace Express {
    interface Response {
      _body: string;
    }
  }
}
