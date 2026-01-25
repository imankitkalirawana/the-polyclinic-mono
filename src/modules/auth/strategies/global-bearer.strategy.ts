import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { Role } from 'src/common/enums/role.enum';

export interface GlobalJwtPayload {
  sessionId: string;
  userId: string;
  email: string;
  role: Role;
  type: 'global';
}

@Injectable()
export class GlobalBearerStrategy extends PassportStrategy(Strategy, 'bearer') {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: unknown) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const jwt = payload as Partial<GlobalJwtPayload>;
    if (jwt.type !== 'global') {
      throw new UnauthorizedException('Invalid token type');
    }
    if (!jwt.sessionId || !jwt.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const digest = createHash('sha256').update(token).digest('hex');
    const session = await this.sessionRepository.findOne({
      where: { id: jwt.sessionId },
    });
    if (!session || !session.logged_in || session.user_id !== jwt.userId) {
      throw new UnauthorizedException('Session not found');
    }
    if (session.auth_token_digest !== digest) {
      throw new UnauthorizedException('Session revoked');
    }
    if (new Date() > session.expires_at) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userRepository.findOne({
      where: { id: jwt.userId, deleted: false },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      role: user.role,
      sessionId: session.id,
      type: 'global' as const,
    };
  }
}
