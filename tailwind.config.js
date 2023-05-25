/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [],
    theme: {
        extend: {
            width: {
                50: '50px',
            },
        },
    },
    plugins: [require('tailwind-scrollbar')],
}
