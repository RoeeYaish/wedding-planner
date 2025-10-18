/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
			// keep existing theme values
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			ivory: '#FAFAF7',
			paper: 'var(--card)',
			ink: 'var(--text)',
			muted: 'var(--muted)',
  			gold: '#C8A977',
  			rose: '#E6B8C3',
  			border: '#E5E7EB',
			card: 'var(--card)',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
			fontFamily: {
				display: ['Playfair Display','serif'],
				sans: ['Heebo','system-ui','sans-serif'],
			},
			colors: Object.assign({}, {
				skin: {
					bg: 'var(--bg)',
					card: 'var(--card)',
					text: 'var(--text)',
					muted: 'var(--muted)',
					primary: 'var(--primary)',
					primary600: 'var(--primary-600)',
					accent: 'var(--accent)',
					ring: 'var(--ring)',
					border: 'var(--border)'
				}
			}),
			boxShadow: Object.assign({}, {
				soft: 'var(--shadow)'
			}),
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		boxShadow: {
  			soft: '0 2px 12px rgba(17,24,39,0.06)',
  			lift: '0 8px 24px rgba(17,24,39,0.08)'
  		},
  		fontFamily: {
  			primary: ['Heebo', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
