import { CURRENCY } from '../constants';

export const passwordRegx =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;

export const showAmount = (
  amount: number,
  currency: keyof typeof CURRENCY,
  ignoreFactor?: boolean,
): string => {
  const c = CURRENCY[currency];
  return `${c.symbol}${amount / (ignoreFactor ? 1 : c.stripe_factor)}`;
};

export const daysBetweenDate = (
  start: string | number, // string: '2022-03-15', number: millisecond since Epoch
  end: string | number,
) => {
  const d1 = new Date(start).getTime(),
    d2 = new Date(end).getTime();
  // console.log("d1/d2: ", d1, "//", d2);
  return Math.ceil(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)));
};

export const ramdonString = (length: number | null) => {
  if (length == null || length <= 0) {
    length = 8;
  }
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  const charLength = chars.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return result;
};

export const emailValidate = (email: string) =>
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
