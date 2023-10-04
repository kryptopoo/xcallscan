/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'false',
    content: [
        './node_modules/flowbite-react/**/*.js',
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './lib/**/*.{js,ts,jsx,tsx}',

        // Or if using `src` directory:
        './src/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {}
    },
    plugins: [require('flowbite/plugin')]
}
