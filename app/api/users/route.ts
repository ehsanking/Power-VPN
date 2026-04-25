import { NextResponse } from 'next/server';
import { z } from 'zod';
import pool from '@/lib/db';
import { auditLog } from '@/lib/audit-logger';

const UserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
});

const CreateUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['admin', 'user', 'reseller']).default('user'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedQuery = UserQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!validatedQuery.success) {
      return NextResponse.json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid query parameters',
          details: validatedQuery.error.format()
        }
      }, { status: 400 });
    }

    const { page, limit, search } = validatedQuery.data;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, username, role, created_at FROM vpn_users';
    let countSql = 'SELECT COUNT(*) as total FROM vpn_users';
    const params: any[] = [];

    if (search) {
      sql += ' WHERE username LIKE ?';
      countSql += ' WHERE username LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(sql, params);
    const [countResult]: any = await pool.execute(countSql, params.slice(0, 1));
    const total = countResult[0].total;

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error.message
      }
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateUserSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: validatedData.error.format()
        }
      }, { status: 400 });
    }

    const { username, password, role } = validatedData.data;

    // In a real app, hash password here
    const [result]: any = await pool.execute(
      'INSERT INTO vpn_users (username, password, role, created_at) VALUES (?, ?, ?, NOW())',
      [username, password, role]
    );

    await auditLog(null, 'USER_CREATED', `User ${username} created with role ${role}`);

    return NextResponse.json({
      data: {
        id: result.insertId,
        username,
        role
      }
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        error: {
          code: 'DUPLICATE_USER',
          message: 'Username already exists'
        }
      }, { status: 409 });
    }

    return NextResponse.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create user',
        details: error.message
      }
    }, { status: 500 });
  }
}
