import { sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.naverClientId || !config.naverClientSecret) {
    throw createError({
      statusCode: 500,
      message: 'Naver OAuth 설정이 되어있지 않습니다.'
    })
  }

  const authUrl = `https://nid.naver.com/oauth2.0/authorize?` + new URLSearchParams({
    client_id: config.naverClientId,
    redirect_uri: `${getRequestURL(event).origin}/api/auth/naver/callback`,
    response_type: 'code',
    state: Math.random().toString(36).substring(7)
  })

  return sendRedirect(event, authUrl)
})
