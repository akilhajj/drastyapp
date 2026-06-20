export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // إعدادات الـ CORS المعتمدة لضمان استقبال طلبات الـ HTML من GitHub للجوال داخل سوريا
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // ========================================================
        // 1. مسار تسجيل الدخول والفرز المركزي وتوجيه الرتب (Login)
        // ========================================================
        if (url.pathname === "/api/login" && request.method === "POST") {
            try {
                const { email, password } = await request.json();
                const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

                if (!user) {
                    return new Response(JSON.stringify({ success: false, message: "الحساب غير مسجل بالأكاديمية سحابياً!" }), { status: 401, headers: corsHeaders });
                }

                if (user.password_hash !== password) {
                    return new Response(JSON.stringify({ success: false, message: "كلمة المرور المدخلة غير صحيحة!" }), { status: 401, headers: corsHeaders });
                }

                if (user.status === 'pending' && user.role !== 'admin') {
                    return new Response(JSON.stringify({ success: false, message: "حسابك معلق، يرجى انتظار تفعيل الإدارة الكريمة بالأيام." }), { status: 403, headers: corsHeaders });
                }

                const generatedToken = btoa(`${user.id}-${Date.now()}`);
                let redirectUrl = "index.html";
                
                if (user.role === 'admin') redirectUrl = `admin.html?token=${generatedToken}`;
                else if (user.role === 'teacher') redirectUrl = `teacher.html?token=${generatedToken}`;
                else if (user.role === 'student') redirectUrl = `student.html?token=${generatedToken}`;

                return new Response(JSON.stringify({
                    success: true,
                    message: "تم التحقق الأمني بنجاح!",
                    role: user.role,
                    token: generatedToken,
                    redirectUrl: redirectUrl
                }), { headers: corsHeaders });

            } catch (err) {
                return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        // ========================================================
        // 2. مسار استقبال وتسجيل الحسابات الجديدة المعلقة (Register)
        // ========================================================
        if (url.pathname === "/api/register" && request.method === "POST") {
            try {
                const { id, name, phone, email, password, role, grade, branch } = await request.json();
                
                await env.DB.prepare(
                    "INSERT INTO users (id, name, phone, email, password_hash, role, grade, branch, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
                ).bind(id, name, phone, email, password, role, grade, branch).run();

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, message: "البريد الإلكتروني مسجل مسبقاً بالنظام!" }), { status: 400, headers: corsHeaders });
            }
        }

        // ========================================================
        // 3. رادار الأدمن لجلب الحسابات المعلقة وتفعيلها بالأيام (Admin Radar)
        // ========================================================
        if (url.pathname === "/api/get-pending-users" && request.method === "GET") {
            try {
                const { results } = await env.DB.prepare("SELECT id, name, role, grade FROM users WHERE status = 'pending'").all();
                return new Response(JSON.stringify({ users: results }), { headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        if (url.pathname === "/api/update-user-status" && request.method === "POST") {
            try {
                const { userId, status, allowed_days } = await request.json();
                await env.DB.prepare("UPDATE users SET status = ?, allowed_days = ? WHERE id = ?")
                    .bind(status, allowed_days, userId)
                    .run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        // ========================================================
        // 4. جدول المعهد ورفع الحصص الموجهة للـ AI (Lessons System)
        // ========================================================
        if (url.pathname === "/api/schedule-daily-lesson" && request.method === "POST") {
            try {
                const { duration, target_group, lesson_title, lesson_file_content, lesson_scenario } = await request.json();
                await env.DB.prepare(
                    "INSERT INTO daily_lessons (duration, target_group, lesson_title, lesson_file_content, lesson_scenario) VALUES (?, ?, ?, ?, ?)"
                ).bind(duration, target_group, lesson_title, lesson_file_content, lesson_scenario).run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        // ========================================================
        // 5. استقبال ورادار رسائل فورم اتصل بنا (Contact Form)
        // ========================================================
        if (url.pathname === "/api/send-contact-message" && request.method === "POST") {
            try {
                const { sender_name, sender_phone, sender_email, message_text } = await request.json();
                await env.DB.prepare(
                    "INSERT INTO contact_messages (sender_name, sender_phone, sender_email, message_text) VALUES (?, ?, ?, ?)"
                ).bind(sender_name, sender_phone, sender_email, message_text).run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        if (url.pathname === "/api/get-contact-messages" && request.method === "GET") {
            try {
                const { results } = await env.DB.prepare("SELECT * FROM contact_messages ORDER BY id DESC").all();
                return new Response(JSON.stringify({ messages: results }), { headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        return new Response(JSON.stringify({ message: "مكتبة الأكاديمية السحابية نشطة" }), { status: 404, headers: corsHeaders });
    }
};
