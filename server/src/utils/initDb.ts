import { getPool } from '../config/database';
import { logger } from './logger';

export const initDb = async (): Promise<void> => {
    const pool = getPool();

    try {
        // Users table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) NOT NULL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('apprentice', 'instructor', 'admin') NOT NULL DEFAULT 'apprentice',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        avatar_url VARCHAR(255) NULL,
        cover_image_url VARCHAR(255) NULL,
        headline VARCHAR(255) NULL,
        bio TEXT NULL,
        instagram_url VARCHAR(255) NULL,
        github_url VARCHAR(255) NULL,
        facebook_url VARCHAR(255) NULL,
        contact_email VARCHAR(255) NULL,
        x_url VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // User sessions (para refresh tokens)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        refresh_token_hash VARCHAR(255) NOT NULL,
        device VARCHAR(160) NULL,
        ip_address VARCHAR(45) NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Password reset tokens
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Chats table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NULL,
        is_group BOOLEAN NOT NULL DEFAULT FALSE,
        created_by CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Chat Members table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_members (
        chat_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP NULL,
        PRIMARY KEY (chat_id, user_id),
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Messages table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id CHAR(36) NOT NULL PRIMARY KEY,
        chat_id CHAR(36) NOT NULL,
        sender_id CHAR(36) NOT NULL,
        content TEXT NULL,
        attachment_url VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Feed Posts table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS feed_posts (
        id CHAR(36) NOT NULL PRIMARY KEY,
        author_id CHAR(36) NOT NULL,
        content TEXT NULL,
        media_url VARCHAR(255) NULL,
        tags JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Add shared_post_id to messages (for shared publication in chat)
        try {
            await pool.execute(`
      ALTER TABLE messages ADD COLUMN shared_post_id CHAR(36) NULL,
        ADD CONSTRAINT fk_messages_shared_post
        FOREIGN KEY (shared_post_id) REFERENCES feed_posts(id) ON DELETE SET NULL
    `);
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (msg !== 'ER_DUP_FIELDNAME' && msg !== 'ER_FK_DUP_NAME') {
                throw err;
            }
        }

        // Feed Post Attachments table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS feed_post_attachments (
        id CHAR(36) NOT NULL PRIMARY KEY,
        post_id CHAR(36) NOT NULL,
        url VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Feed Comments table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS feed_comments (
        id CHAR(36) NOT NULL PRIMARY KEY,
        post_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        content TEXT NOT NULL,
        attachment_url VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Feed Post Reactions table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS feed_post_reactions (
        post_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        reaction_type ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry') NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Feed Saved Posts table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS feed_saved_posts (
        post_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Feed Shares table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS feed_shares (
        id CHAR(36) NOT NULL PRIMARY KEY,
        post_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        message TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Stories table (historias tipo Instagram, visibles por amigos durante 24h)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS stories (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        media_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Story views (quién ha visto cada historia)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS story_views (
        story_id CHAR(36) NOT NULL,
        viewer_id CHAR(36) NOT NULL,
        viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (story_id, viewer_id),
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Feed Reports table (mirrors the logic in feedRepository but good to have here too for completeness, though repository handles it safely)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS feed_reports (
        id CHAR(36) NOT NULL PRIMARY KEY,
        post_id CHAR(36) NOT NULL,
        reporter_id CHAR(36) NOT NULL,
        comment_id CHAR(36) NULL,
        reason VARCHAR(255) NOT NULL,
        details TEXT,
        status ENUM('pending','reviewed') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (post_id) REFERENCES feed_posts (id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES feed_comments (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Notifications table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(500) NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Projects table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        repository_url VARCHAR(500) NULL,
        status ENUM('draft', 'in_progress', 'completed') NOT NULL DEFAULT 'draft',
        owner_id CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Project members table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        role ENUM('member', 'lead', 'coach') NOT NULL DEFAULT 'member',
        PRIMARY KEY (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Library resources table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS library_resources (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        resource_type ENUM('document', 'video', 'link', 'course', 'other') NOT NULL,
        url VARCHAR(500) NULL,
        uploaded_by CHAR(36) NOT NULL,
        tags JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Friend requests table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id CHAR(36) NOT NULL PRIMARY KEY,
        sender_id CHAR(36) NOT NULL,
        receiver_id CHAR(36) NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Friends table (friendships)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS friends (
        user_id CHAR(36) NOT NULL,
        friend_id CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, friend_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // User login activity (para actividad de perfil)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_login_activity (
        user_id CHAR(36) NOT NULL,
        activity_date DATE NOT NULL,
        login_count INT NOT NULL DEFAULT 1,
        last_login DATETIME NULL,
        PRIMARY KEY (user_id, activity_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Project activity logs (contribuciones en proyectos)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS project_activity_logs (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        project_id CHAR(36) NOT NULL,
        activity_date DATE NOT NULL,
        contribution_points INT NOT NULL DEFAULT 1,
        description VARCHAR(500) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        logger.info('Database initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize database', { error });
        throw error;
    }
};
