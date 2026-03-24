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
        profile_skills JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        try {
            await pool.execute(
                'ALTER TABLE users ADD COLUMN profile_skills JSON NULL'
            );
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (msg !== 'ER_DUP_FIELDNAME') throw err;
        }

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
        reaction_type ENUM('like', 'celebrate', 'love', 'insightful', 'support') NOT NULL,
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
        cover_image VARCHAR(500) NULL,
        workspace_notes TEXT NULL,
        status ENUM('draft', 'in_progress', 'completed') NOT NULL DEFAULT 'draft',
        owner_id CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        try {
            await pool.execute('ALTER TABLE projects ADD COLUMN cover_image VARCHAR(500) NULL');
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (msg !== 'ER_DUP_FIELDNAME') throw err;
        }

        try {
            await pool.execute('ALTER TABLE projects ADD COLUMN workspace_notes TEXT NULL');
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (msg !== 'ER_DUP_FIELDNAME') throw err;
        }

        await pool.execute(`
      CREATE TABLE IF NOT EXISTS project_attachments (
        id CHAR(36) NOT NULL PRIMARY KEY,
        project_id CHAR(36) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        uploaded_by CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
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

        // Study groups table (comunidades)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS study_groups (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        cover_image VARCHAR(500) NULL,
        icon_url VARCHAR(500) NULL,
        created_by CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Group members table (miembros de comunidades)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Channels table (canales de comunidades)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS channels (
        id CHAR(36) NOT NULL PRIMARY KEY,
        community_id CHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        type ENUM('text', 'voice') NOT NULL DEFAULT 'text',
        position INT NOT NULL DEFAULT 0,
        created_by CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (community_id) REFERENCES study_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Channel messages table (mensajes en canales)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS channel_messages (
        id CHAR(36) NOT NULL PRIMARY KEY,
        channel_id CHAR(36) NOT NULL,
        sender_id CHAR(36) NOT NULL,
        content TEXT NULL,
        attachment_url VARCHAR(500) NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        pinned_at TIMESTAMP NULL,
        pinned_by CHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (pinned_by) REFERENCES users(id) ON DELETE SET NULL
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

        const [channelMessagesTableRows] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'channel_messages'
    `);
        const hasChannelMessagesTable = Array.isArray(channelMessagesTableRows) && channelMessagesTableRows.length > 0;

        // Migración: columnas de fijado en channel_messages (si la tabla existe)
        for (const sql of [
            'ALTER TABLE channel_messages ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE',
            'ALTER TABLE channel_messages ADD COLUMN pinned_at TIMESTAMP NULL',
            'ALTER TABLE channel_messages ADD COLUMN pinned_by CHAR(36) NULL',
        ]) {
            try {
                if (hasChannelMessagesTable) {
                    await pool.execute(sql);
                }
            } catch (err: unknown) {
                const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
                if (msg !== 'ER_DUP_FIELDNAME' && msg !== 'ER_NO_SUCH_TABLE') throw err;
            }
        }

        // Tabla channel_message_stars (destacar / favoritos)
        try {
            if (hasChannelMessagesTable) {
                await pool.execute(`
                CREATE TABLE IF NOT EXISTS channel_message_stars (
                    message_id CHAR(36) NOT NULL,
                    user_id CHAR(36) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (message_id, user_id),
                    FOREIGN KEY (message_id) REFERENCES channel_messages(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            } else {
                logger.warn('Skipping channel_message_stars initialization because channel_messages table is missing');
            }
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (msg !== 'ER_NO_SUCH_TABLE' && msg !== 'ER_FK_NO_INDEX_PARENT' && msg !== 'ER_FK_CANNOT_OPEN_PARENT') throw err;
        }

        // Tabla channel_message_reports
        try {
            if (hasChannelMessagesTable) {
                await pool.execute(`
                CREATE TABLE IF NOT EXISTS channel_message_reports (
                    id CHAR(36) NOT NULL PRIMARY KEY,
                    message_id CHAR(36) NOT NULL,
                    reporter_id CHAR(36) NOT NULL,
                    reason VARCHAR(255) NOT NULL,
                    details TEXT NULL,
                    status ENUM('pending','reviewed') NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    resolved_at TIMESTAMP NULL DEFAULT NULL,
                    FOREIGN KEY (message_id) REFERENCES channel_messages(id) ON DELETE CASCADE,
                    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            } else {
                logger.warn('Skipping channel_message_reports initialization because channel_messages table is missing');
            }
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (msg !== 'ER_NO_SUCH_TABLE' && msg !== 'ER_FK_NO_INDEX_PARENT' && msg !== 'ER_FK_CANNOT_OPEN_PARENT') throw err;
        }

        // Hilos en canales (respuestas ancladas a un mensaje raíz)
        for (const sql of [
            'ALTER TABLE channel_messages ADD COLUMN thread_root_id CHAR(36) NULL',
            'ALTER TABLE channel_messages ADD COLUMN thread_title VARCHAR(120) NULL',
        ]) {
            try {
                if (hasChannelMessagesTable) {
                    await pool.execute(sql);
                }
            } catch (err: unknown) {
                const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
                if (msg !== 'ER_DUP_FIELDNAME' && msg !== 'ER_NO_SUCH_TABLE') throw err;
            }
        }

        try {
            if (hasChannelMessagesTable) {
                await pool.execute(`
                ALTER TABLE channel_messages
                ADD CONSTRAINT fk_channel_messages_thread_root
                FOREIGN KEY (thread_root_id) REFERENCES channel_messages(id) ON DELETE CASCADE
            `);
            }
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            const ok =
                msg === 'ER_DUP_KEYNAME' ||
                msg === 'ER_FK_DUP_NAME' ||
                msg === 'ER_NO_SUCH_TABLE' ||
                msg === 'ER_CANT_CREATE_TABLE';
            if (!ok) throw err;
        }

        // Votos de encuestas en mensajes de canal (__POLL__:…)
        try {
            if (hasChannelMessagesTable) {
                await pool.execute(`
                CREATE TABLE IF NOT EXISTS channel_message_poll_votes (
                    message_id CHAR(36) NOT NULL,
                    user_id CHAR(36) NOT NULL,
                    option_index INT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (message_id, user_id),
                    FOREIGN KEY (message_id) REFERENCES channel_messages(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            }
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
            if (msg !== 'ER_NO_SUCH_TABLE' && msg !== 'ER_FK_NO_INDEX_PARENT' && msg !== 'ER_FK_CANNOT_OPEN_PARENT') throw err;
        }

        // Migración: feed_post_reactions.reaction_type debe coincidir con ReactionType de la API
        // (antes: like/love/haha/wow/sad/angry — la app usa celebrate/insightful/support)
        const [feedReactionsTableRows] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'feed_post_reactions'
    `);
        const hasFeedPostReactions =
            Array.isArray(feedReactionsTableRows) && feedReactionsTableRows.length > 0;
        if (hasFeedPostReactions) {
            const [colMeta] = await pool.query(
                `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'feed_post_reactions'
           AND COLUMN_NAME = 'reaction_type'`
            );
            const columnType =
                Array.isArray(colMeta) &&
                colMeta[0] &&
                typeof colMeta[0] === 'object' &&
                'COLUMN_TYPE' in colMeta[0]
                    ? String((colMeta[0] as { COLUMN_TYPE: string }).COLUMN_TYPE)
                    : '';
            const reactionsSchemaOk =
                columnType.includes('insightful') && columnType.includes('celebrate');
            if (!reactionsSchemaOk) {
                try {
                    await pool.execute(`
            ALTER TABLE feed_post_reactions
            MODIFY COLUMN reaction_type VARCHAR(32) NOT NULL
          `);
                } catch (err: unknown) {
                    const msg =
                        err && typeof err === 'object' && 'code' in err
                            ? String((err as { code: string }).code)
                            : '';
                    if (msg !== 'ER_NO_SUCH_TABLE') throw err;
                }
                await pool.execute(`
          UPDATE feed_post_reactions SET reaction_type = 'celebrate' WHERE reaction_type = 'haha'
        `);
                await pool.execute(`
          UPDATE feed_post_reactions SET reaction_type = 'insightful' WHERE reaction_type = 'wow'
        `);
                await pool.execute(`
          UPDATE feed_post_reactions SET reaction_type = 'support' WHERE reaction_type IN ('sad', 'angry')
        `);
                await pool.execute(`
          ALTER TABLE feed_post_reactions
          MODIFY COLUMN reaction_type ENUM(
            'like', 'celebrate', 'love', 'insightful', 'support'
          ) NOT NULL
        `);
            }
        }

        logger.info('Database initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize database', { error });
        throw error;
    }
};
