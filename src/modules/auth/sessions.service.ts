import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: number,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      sessionId: uuidv4(),
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    });
    return this.sessionRepository.save(session);
  }

  /**
   * Find a session by sessionId
   */
  async findSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: {
        sessionId,
      },
    });
  }

  /**
   * Find all active sessions for a user
   */
  async findSessionsByUserId(userId: number): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        expiresAt: MoreThan(new Date()), // Only active sessions
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Validate a session (check if it exists and is not expired)
   */
  async validateSession(sessionId: string): Promise<Session> {
    const session = await this.findSessionById(sessionId);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (new Date() > session.expiresAt) {
      // Session expired, delete it
      await this.deleteSession(sessionId);
      throw new UnauthorizedException('Session has expired');
    }

    return session;
  }

  /**
   * Delete a session by sessionId
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({
      sessionId,
    });
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllUserSessions(userId: number): Promise<void> {
    await this.sessionRepository.delete({
      userId,
    });
  }

  /**
   * Delete expired sessions (cleanup task)
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  /**
   * Update session expiration time
   */
  async refreshSession(
    sessionId: string,
    newExpiresAt: Date,
  ): Promise<Session> {
    await this.sessionRepository.update(
      { sessionId },
      { expiresAt: newExpiresAt },
    );
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
    });
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }
    return session;
  }
}
