function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {currentYear} TaskRover Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;