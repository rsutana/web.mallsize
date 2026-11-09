export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      secondary: 'accent',
      neutral: 'stone'
    },
    button: {
      slots: {
        base: 'rounded-[10px] font-semibold justify-center min-h-11 cursor-pointer'
      },
      defaultVariants: {
        size: 'lg'
      }
    },
    input: {
      slots: {
        base: 'rounded-[10px] min-h-[46px] text-[15px]'
      },
      defaultVariants: {
        size: 'xl'
      }
    },
    select: {
      slots: {
        base: 'rounded-[10px] min-h-[46px] text-[15px]'
      },
      defaultVariants: {
        size: 'xl'
      }
    },
    textarea: {
      slots: {
        base: 'rounded-[10px] text-[15px]'
      },
      defaultVariants: {
        size: 'xl'
      }
    },
    formField: {
      slots: {
        label: 'text-sm font-medium text-ink-700',
        help: 'text-xs text-ink-500'
      }
    }
  },

  /**
   * Site details shown on the public pages. Placeholders come from the design;
   * replace them with the training center's real details.
   */
  site: {
    name: 'MallSize Training Center',
    tagline: 'Together, We Build Your Future.',
    accreditation: 'TESDA-accredited TVI · Davao',
    address: '[Training center address], Davao Region',
    mobile: '[09XX XXX XXXX]',
    email: '[enroll@mallsize.ph]',
    officeHours: '[Mon–Sat, 8:00 AM – 5:00 PM]',
    mapEmbedUrl: '',
    facebookUrl: 'https://www.facebook.com/',
    tiktokUrl: 'https://www.tiktok.com/',
    stats: {
      graduates: '[##]',
      years: '[##]',
      rating: '[4.9]',
      reviews: '[##]'
    },
    acceptedPayments: 'GCash · Maya · Bank transfer / QR Ph'
  }
})
