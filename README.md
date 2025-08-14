# NeuroNest 🧠✨

**An ADHD-friendly smart planner designed to help neurodivergent minds thrive through structured organization and stress-aware task management.**

## 🎯 Vision & Mission

NeuroNest was born from the understanding that traditional productivity tools often fail to accommodate the unique needs of individuals with ADHD. Our mission is to create a planning application that works *with* neurodivergent brains, not against them.

### Why NeuroNest?

- **ADHD-Friendly Design**: Every feature is crafted with ADHD challenges in mind - from executive dysfunction to time blindness
- **Stress-Aware Planning**: Built-in stress indicators help you make informed decisions about task scheduling
- **Visual Organization**: Color-coded subjects and intuitive layouts reduce cognitive load
- **Flexible Structure**: Accommodates the non-linear thinking patterns common in ADHD

## ✨ Key Features

### 🎨 **Visual Organization**
- **Color-coded subjects** for instant recognition and reduced decision fatigue
- **Chapter-based content organization** that mirrors how ADHD brains naturally categorize information
- **Clean, distraction-free interface** designed to minimize overwhelm

### 📅 **Smart Time Management**
- **Time blocking** with drag-and-drop functionality for easy schedule adjustments
- **Calendar integration** that respects your existing commitments
- **Flexible scheduling** that adapts to ADHD time perception challenges

### 🎯 **Stress-Aware Task Management**
- **Stress indicators** help you identify and manage overwhelming tasks
- **Task prioritization** based on both importance and mental energy requirements
- **Unscheduled task pool** for brain dumps and later organization

### 🔐 **Personalized Experience**
- **User authentication** for secure, personalized planning
- **Customizable workflows** that adapt to your unique ADHD presentation
- **Progress tracking** that celebrates small wins

## 🛠️ Tech Stack

### **Frontend & Framework**
- **Next.js 14** with App Router - Modern React framework for optimal performance
- **React 18** - Component-based UI architecture
- **TypeScript 5** - Type safety for reliable, maintainable code

### **Styling & User Experience**
- **Tailwind CSS** - Utility-first styling for consistent, responsive design
- **Lucide React** - Clean, accessible icons
- **@dnd-kit** - Smooth drag-and-drop interactions for intuitive task management

### **Backend & Data**
- **Supabase** - Comprehensive backend-as-a-service
  - Real-time database for instant updates
  - Built-in authentication system
  - Server-side rendering support
- **PostgreSQL** - Robust, scalable database

### **Development & Quality**
- **ESLint** - Code quality and consistency
- **Vitest** - Fast, reliable testing framework
- **TypeScript** - Static type checking for fewer bugs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neuronest.git
   cd neuronest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── calendar/          # Calendar view and scheduling
│   ├── dashboard/         # Main dashboard interface
│   ├── login/            # Authentication pages
│   └── settings/         # User preferences
├── components/           # Reusable UI components
│   ├── modals/          # Modal dialogs for interactions
│   ├── layout/          # Navigation and layout components
│   └── features/        # Feature-specific components
├── lib/                 # Utilities and configurations
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## 🎨 Design Philosophy

### ADHD-Centered Design Principles

1. **Reduce Cognitive Load**: Minimize decision fatigue through clear visual hierarchies and consistent patterns
2. **Embrace Non-Linear Thinking**: Support the natural ADHD tendency to jump between tasks and ideas
3. **Stress Awareness**: Acknowledge that stress impacts ADHD symptoms and plan accordingly
4. **Flexible Structure**: Provide organization without rigid constraints that feel overwhelming
5. **Visual Feedback**: Use color, icons, and spatial relationships to convey information quickly

## 🤝 Contributing

We welcome contributions from the ADHD community and allies! Whether you're:
- A developer with ADHD who understands the challenges firsthand
- A UX designer passionate about accessibility
- Someone with ideas for ADHD-friendly features

Your input is valuable. Please read our contributing guidelines and feel free to open issues or submit pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The ADHD community for sharing their experiences and needs
- Accessibility advocates who push for inclusive design
- Open source contributors who make projects like this possible

---

**Built with ❤️ for the neurodivergent community**

*NeuroNest: Where ADHD minds find their rhythm*
