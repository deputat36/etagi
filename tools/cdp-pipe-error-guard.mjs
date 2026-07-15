export function attachCdpPipeErrorHandlers(input, output, failAll){
  if(!input || typeof input.on !== 'function') throw new TypeError('CDP input stream не поддерживает события.');
  if(!output || typeof output.on !== 'function') throw new TypeError('CDP output stream не поддерживает события.');
  if(typeof failAll !== 'function') throw new TypeError('CDP failAll должен быть функцией.');

  input.on('error', error => {
    failAll(toCdpPipeError('write', error));
  });
  output.on('error', error => {
    failAll(toCdpPipeError('read', error));
  });
}

function toCdpPipeError(direction, error){
  const code = String(error?.code || 'UNKNOWN');
  const message = String(error?.message || error || 'неизвестная ошибка');
  const wrapped = new Error(`Chrome CDP pipe ${direction}: ${code} — ${message}`);
  wrapped.code = code;
  wrapped.direction = direction;
  if(error instanceof Error) wrapped.cause = error;
  return wrapped;
}
