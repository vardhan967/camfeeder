import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

authRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // For simplicity, hardcoded admin check
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ id: 'admin1', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: 'admin1', username: 'admin' } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
