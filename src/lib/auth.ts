import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
          GoogleProvider({
                  clientId: process.env.GOOGLE_CLIENT_ID!,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
          CredentialsProvider({
                  name: 'credentials',
                  credentials: {
                            email: { label: 'Email', type: 'email' },
                            password: { label: 'Password', type: 'password' },
                  },
                  async authorize(credentials) {
                            if (!credentials?.email || !credentials?.password) {
                                        throw new Error('Email and password are required');
                            }

                    const user = await prisma.user.findUnique({
                                where: { email: credentials.email.toLowerCase() },
                    });

                    if (!user || !user.password_hash) {
                                throw new Error('Invalid email or password');
                    }

                    // Block login if email not verified
                    if (!user.email_verified) {
                                throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password_hash);

                    if (!isValid) {
                                throw new Error('Invalid email or password');
                    }

                    return {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                role: user.role,
                                emailVerified: user.email_verified,
                    };
                  },
          }),
        ],
    session: {
          strategy: 'jwt',
    },
    callbacks: {
          async signIn({ user, account, profile }) {
                  if (account?.provider === 'google') {
                            try {
                                        const existingUser = await prisma.user.findUnique({
                                                      where: { email: user.email! },
                                        });

                              if (existingUser) {
                                            // Auto-verify Google users - their email is pre-verified by Google
                                          if (!existingUser.email_verified) {
                                                          await prisma.user.update({
                                                                            where: { id: existingUser.id },
                                                                            data: { email_verified: true, email_verified_at: new Date() },
                                                          });
                                          }

                                          const existingAccount = await prisma.account.findUnique({
                                                          where: {
                                                                            provider_providerAccountId: {
                                                                                                provider: 'google',
                                                                                                providerAccountId: account.providerAccountId,
                                                                            },
                                                          },
                                          });

                                          if (!existingAccount) {
                                                          await prisma.account.create({
                                                                            data: {
                                                                                                userId: existingUser.id,
                                                                                                type: account.type,
                                                                                                provider: account.provider,
                                                                                                providerAccountId: account.providerAccountId,
                                                                                                access_token: account.access_token,
                                                                                                refresh_token: account.refresh_token,
                                                                                                expires_at: account.expires_at,
                                                                                                token_type: account.token_type,
                                                                                                scope: account.scope,
                                                                                                id_token: account.id_token,
                                                                            },
                                                          });
                                          }

                                          return true;
                              }
                                        return true;
                            } catch (error) {
                                        console.error('Error during Google sign in:', error);
                                        return false;
                            }
                  }
                  return true;
          },
          async jwt({ token, user, account }) {
                  if (user) {
                            token.id = user.id;
                            token.role = (user as any).role;
                            token.emailVerified = (user as any).emailVerified;
                  }

            if (account?.provider === 'google') {
                      const dbUser = await prisma.user.findUnique({
                                  where: { email: token.email! },
                      });
                      if (dbUser) {
                                  token.id = dbUser.id;
                                  token.role = dbUser.role;
                                  token.emailVerified = dbUser.email_verified;
                      }
            }

            return token;
          },
          async session({ session, token }) {
                  if (session.user) {
                            (session.user as any).id = token.id;
                            (session.user as any).role = token.role;
                            (session.user as any).emailVerified = token.emailVerified;
                  }
                  return session;
          },
    },
    pages: {
          signIn: '/auth/login',
          error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
