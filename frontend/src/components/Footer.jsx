import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-line mt-20 text-ink py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        
        {/* Col 1 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-navy">Online Shopping</h4>
          <ul className="space-y-2 text-[13px] text-gray-600">
            <li><Link to="/products?cat=Shirts" className="hover:text-navy transition-colors">Shirts</Link></li>
            <li><Link to="/products?cat=Polos" className="hover:text-navy transition-colors">Polos</Link></li>
            <li><Link to="/products?cat=T-Shirts" className="hover:text-navy transition-colors">T-Shirts</Link></li>
            <li><Link to="/products?cat=Trousers" className="hover:text-navy transition-colors">Trousers</Link></li>
            <li><Link to="/products?cat=Jeans" className="hover:text-navy transition-colors">Jeans</Link></li>
            <li><Link to="/products?cat=Jackets" className="hover:text-navy transition-colors">Jackets</Link></li>
          </ul>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-navy">Customer Policies</h4>
          <ul className="space-y-2 text-[13px] text-gray-600">
            <li><span className="cursor-pointer hover:text-navy transition-colors">Contact Us</span></li>
            <li><span className="cursor-pointer hover:text-navy transition-colors">FAQ</span></li>
            <li><span className="cursor-pointer hover:text-navy transition-colors">T&C</span></li>
            <li><span className="cursor-pointer hover:text-navy transition-colors">Terms Of Use</span></li>
            <li><span className="cursor-pointer hover:text-navy transition-colors">Track Orders</span></li>
            <li><span className="cursor-pointer hover:text-navy transition-colors">Returns & Exchanges</span></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="/logo.png" 
              alt="Dominion Logo" 
              className="h-10 w-auto object-contain" 
            />
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide leading-none text-ink">DOMINION CLOTHING</h4>
              <p className="text-[9px] text-navy mt-1.5 uppercase tracking-widest font-bold">Walk in Power. Dress in Purpose.</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mb-4">
            Experience premium lifestyle apparel tailored to your style. Designed with focus on quality fabric, comfort, and perfect fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-navy"></span> 100% ORIGINAL GUARANTEED</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-navy"></span> EASY 14 DAYS RETURNS</span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-line pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
        <span>© 2026 Dominion Clothing. All Rights Reserved.</span>
        <div className="flex gap-4">
          <span className="hover:text-navy transition-colors cursor-pointer font-bold">Facebook</span>
          <span className="hover:text-navy transition-colors cursor-pointer font-bold">Instagram</span>
          <span className="hover:text-navy transition-colors cursor-pointer font-bold">Twitter</span>
        </div>
      </div>
    </footer>
  );
}
