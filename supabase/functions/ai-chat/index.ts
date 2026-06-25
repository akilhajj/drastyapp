import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // Voice mode: multipart form with audio file
    if (contentType.includes("multipart/form-data")) {
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ response: "AI service not configured. Please add your OpenAI API key." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      const language = (formData.get("language") as string) || "ar";

      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: "No audio file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 1: Transcribe with Whisper
      const whisperForm = new FormData();
      whisperForm.append("file", audioFile, "recording.webm");
      whisperForm.append("model", "whisper-1");
      whisperForm.append("language", language === "ar" ? "ar" : "en");

      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: whisperForm,
      });

      if (!whisperRes.ok) {
        const err = await whisperRes.text();
        return new Response(
          JSON.stringify({ response: language === "ar" ? "تعذر معالجة الصوت." : "Could not process audio.", error: err }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { text: transcribedText } = await whisperRes.json();

      // Step 2: Get AI response via GPT
      const systemPrompt = language === "ar"
        ? `أنت مساعد تعليمي ذكي متخصص في المنهج السوري. أجب على أسئلة الطلاب بشكل واضح ومبسط باللغة العربية. تخصصاتك: العلوم، اللغة العربية، اللغة الفرنسية، الرياضيات، التربية الدينية.`
        : `You are a smart educational assistant specializing in the Syrian national curriculum. Answer student questions clearly and simply in English. Your specialties: Science, Arabic Language, French Language, Mathematics, Religious Education.`;

      const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcribedText },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      let aiText = language === "ar"
        ? "شكراً على سؤالك. يمكنني مساعدتك في فهم المناهج الدراسية."
        : "Thank you for your question. I can help you understand the curriculum.";

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        aiText = chatData.choices?.[0]?.message?.content || aiText;
      }

      // Step 3: TTS - convert response to speech
      const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: aiText,
          voice: language === "ar" ? "onyx" : "nova",
          response_format: "mp3",
        }),
      });

      let audioBase64: string | null = null;
      if (ttsRes.ok) {
        const audioBuffer = await ttsRes.arrayBuffer();
        const uint8 = new Uint8Array(audioBuffer);
        let binary = "";
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        audioBase64 = btoa(binary);
      }

      return new Response(
        JSON.stringify({ response: aiText, transcription: transcribedText, audio: audioBase64 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Text mode: JSON body
    const body = await req.json();
    const { message, language = "ar" } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENAI_API_KEY) {
      const fallback = language === "ar"
        ? `شكراً على سؤالك: "${message}". أنا مساعدك الذكي للمنهج السوري. لتفعيل الإجابات الكاملة، يرجى إضافة مفتاح OpenAI API.`
        : `Thank you for your question: "${message}". I'm your AI tutor for the Syrian curriculum. To enable full AI responses, please add your OpenAI API key.`;
      return new Response(
        JSON.stringify({ response: fallback }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = language === "ar"
      ? `أنت مساعد تعليمي ذكي متخصص في المنهج السوري. أجب على أسئلة الطلاب بشكل واضح ومبسط باللغة العربية. تخصصاتك: العلوم، اللغة العربية، اللغة الفرنسية، الرياضيات، التربية الدينية. استخدم أمثلة بسيطة ومناسبة للطلاب.`
      : `You are a smart educational assistant specializing in the Syrian national curriculum. Answer student questions clearly and simply in English. Specialties: Science, Arabic Language, French Language, Mathematics, Religious Education. Use simple examples appropriate for students.`;

    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    let aiResponse = language === "ar"
      ? "عذراً، لم أتمكن من معالجة سؤالك. يرجى المحاولة مرة أخرى."
      : "Sorry, I couldn't process your question. Please try again.";

    if (chatRes.ok) {
      const chatData = await chatRes.json();
      aiResponse = chatData.choices?.[0]?.message?.content || aiResponse;
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
