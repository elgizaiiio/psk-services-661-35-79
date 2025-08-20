
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1536px',
			}
		},
		extend: {
			fontFamily: {
				sans: ['Poppins', 'Inter', 'sans-serif'],
				poppins: ['Poppins', 'sans-serif'],
				inter: ['Inter', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Professional color system
				'theme-bg-primary': 'hsl(var(--background))',
				'theme-bg-secondary': 'hsl(var(--secondary))', 
				'theme-bg-card': 'hsl(var(--card))',
				'theme-text-primary': 'hsl(var(--foreground))',
				'theme-text-secondary': 'hsl(var(--muted-foreground))',
				'theme-accent-primary': 'hsl(var(--primary))',
				'theme-accent-secondary': 'hsl(var(--accent))',
				'theme-accent-gold': 'hsl(45 93% 47%)',
				
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'glow': {
					'0%, 100%': { opacity: '0.8' },
					'50%': { opacity: '1' }
				},
				'clean-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 5px hsl(var(--primary-blue)), 0 0 10px hsl(var(--primary-blue)), 0 0 15px hsl(var(--primary-blue))' 
					},
					'50%': { 
						boxShadow: '0 0 10px hsl(var(--primary-blue)), 0 0 20px hsl(var(--primary-blue)), 0 0 30px hsl(var(--primary-blue))' 
					}
				},
				'success-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 5px hsl(var(--success-green)), 0 0 10px hsl(var(--success-green)), 0 0 15px hsl(var(--success-green))' 
					},
					'50%': { 
						boxShadow: '0 0 10px hsl(var(--success-green)), 0 0 20px hsl(var(--success-green)), 0 0 30px hsl(var(--success-green))' 
					}
				},
				'grid': {
					'0%': { transform: 'translateY(-50%)' },
					'100%': { transform: 'translateY(0%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out forwards',
				'float': 'float 3s infinite ease-in-out',
				'glow': 'glow 2s infinite ease-in-out',
				'clean-pulse': 'clean-pulse 2s infinite ease-in-out',
				'success-pulse': 'success-pulse 2s infinite ease-in-out',
				'grid': 'grid 15s linear infinite'
			},
			spacing: {
				'18': '4.5rem',
				'22': '5.5rem',
			},
			boxShadow: {
				'clean': '0 4px 30px rgba(37, 99, 235, 0.15)',
				'clean-lg': '0 8px 40px rgba(37, 99, 235, 0.2)',
				'clean-glow': '0 0 20px rgba(37, 99, 235, 0.4)',
				'success': '0 4px 30px rgba(34, 197, 94, 0.15)',
				'success-glow': '0 0 20px rgba(34, 197, 94, 0.3)',
				'warning': '0 4px 30px rgba(245, 158, 11, 0.2)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
