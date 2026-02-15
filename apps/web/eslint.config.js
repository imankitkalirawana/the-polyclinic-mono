import { nextConfig } from "@repo/eslint-config/next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  {
    files: ["next.config.*", "postcss.config.*", "tailwind.config.*", "*.config.*"],
    languageOptions: {
      globals: { process: "readonly" },
    },
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "axios",
              importNames: ["default"],
              message: 'Please import axios from "@/lib/axios" instead of directly importing "axios".',
            },
            {
              name: "sonner",
              importNames: ["toast"],
              message: 'Please import addToast from "@heroui/react" instead of using "toast" from sonner.',
            },
            {
              name: "next/navigation",
              importNames: ["useRouter"],
              message: 'Please import useRouter from "nextjs-toploader/app" instead of using "useRouter" from next/navigation.',
            },
            {
              name: "@heroui/react",
              importNames: ["Modal"],
              message: 'Please import Modal from "@/components/ui/modal" instead of using "Modal" from @heroui/react.',
            },
            { name: "yup", message: "Please use zod instead of yup." },
            { name: "formik", message: "Please use react-hook-form instead of formik." },
          ],
        },
      ],
    },
  },
];
