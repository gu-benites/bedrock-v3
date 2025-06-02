export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-center py-8 md:flex-row md:py-10">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Concierge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
