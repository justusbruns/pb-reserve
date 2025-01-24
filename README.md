# PB Reserve - Poembooth Reservation System

A modern, user-friendly web application built with Svelte for managing reservations for Poembooth photo booths. The application supports both Dutch and English languages, providing an intuitive interface for customers to book photo booths for their events.

## Features

- **Multi-language Support**: Full support for Dutch and English
- **Interactive Booking Form**: 
  - Date and time selection
  - Location details with address autocomplete
  - Company information input
  - Separate delivery address option
- **Smart Validation**: Real-time form validation with helpful error messages
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Smooth User Experience**: 
  - Modern animations and transitions
  - Clear success feedback with the PB logo
  - Intuitive navigation

## Technology Stack

- **Frontend Framework**: Svelte
- **Styling**: CSS with Flowbite components
- **Form Handling**: Custom form validation
- **Data Storage**: Airtable integration
- **Geocoding**: Address autocomplete and validation
- **Internationalization**: Built-in language switching

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/justusbruns/pb-reserve.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

- `/src`
  - `/DatumEnTijd` - Main booking form component
  - `/images` - Static assets including logos
  - `/services` - API integrations and services
  - `/translations` - Language files and translations

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is proprietary software owned by Poembooth.
