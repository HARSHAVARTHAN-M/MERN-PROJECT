"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type Inputs = {
  title: string;
  desc: string;
  price: number;
  catSlug: string;
};

type Option = {
  title: string;
  additionalPrice: number;
};

const AddPage = () => {
  const { data: session, status } = useSession();
  const [inputs, setInputs] = useState<Inputs>({
    title: "",
    desc: "",
    price: 0,
    catSlug: "",
  });

  const [option, setOption] = useState<Option>({
    title: "",
    additionalPrice: 0,
  });

  const [options, setOptions] = useState<Option[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated" || !session?.user?.isAdmin) {
    router.push("/");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const changeOption = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOption((prev) => ({
      ...prev,
      [e.target.name]: e.target.name === "additionalPrice"
        ? Number(e.target.value)  // Ensure number type
        : e.target.value,
    }));
  };

  const handleChangeImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      setFile(target.files[0]);
    }
  };

  const upload = async (): Promise<string> => {
    if (!file) throw new Error("No file selected");

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "restaurant");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/lamares/image/upload", {
        method: "POST",
        body: data,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(`Cloudinary upload failed: ${resData.error?.message || "Unknown error"}`);
      }

      return resData.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const imgUrl = await upload();

      const requestBody = {
        img: imgUrl,
        ...inputs,
        options,
      };

      console.log("Submitting data:", requestBody);  // Debugging step

      const res = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(`API Error: ${data.message || res.statusText}`);
      }

      router.push(`/product/${data.id}`);
    } catch (err) {
      console.error("Submit Error:", err);
    }
  };

  return (
    <div className="p-4 lg:px-20 xl:px-40 h-[calc(100vh-6rem)] md:h-[calc(100vh-9rem)] flex items-center justify-center text-red-500">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-6">
        <h1 className="text-4xl mb-2 text-gray-300 font-bold">Add New Product</h1>

        {/* Upload Image */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm cursor-pointer flex gap-4 items-center" htmlFor="file">
            <Image src="/upload.png" alt="" width={30} height={20} />
            <span>Upload Image</span>
          </label>
          <input type="file" onChange={handleChangeImg} id="file" className="hidden" />
        </div>

        {/* Title */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm">Title</label>
          <input
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
            type="text"
            placeholder="Bella Napoli"
            name="title"
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm">Description</label>
          <textarea
            rows={3}
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
            placeholder="A delicious pizza with fresh ingredients."
            name="desc"
            onChange={handleChange}
          />
        </div>

        {/* Price */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm">Price</label>
          <input
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
            type="number"
            placeholder="29"
            name="price"
            onChange={handleChange}
          />
        </div>

        {/* Category */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm">Category</label>
          <input
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
            type="text"
            placeholder="pizzas"
            name="catSlug"
            onChange={handleChange}
          />
        </div>

        {/* Options */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm">Options</label>
          <div className="flex">
            <input
              className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
              type="text"
              placeholder="Title"
              name="title"
              onChange={changeOption}
            />
            <input
              className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
              type="number"
              placeholder="Additional Price"
              name="additionalPrice"
              onChange={changeOption}
            />
            <button
              type="button"
              className="bg-gray-500 p-2 text-white"
              onClick={() => setOptions((prev) => [...prev, option])}
            >
              Add Option
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {options.map((opt) => (
              <div
                key={opt.title}
                className="p-2 rounded-md cursor-pointer bg-gray-200 text-gray-400"
                onClick={() => setOptions((prev) => prev.filter((item) => item.title !== opt.title))}
              >
                <span>{opt.title}</span>
                <span className="text-xs"> (+ ${opt.additionalPrice})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-red-500 p-4 text-white w-48 rounded-md relative h-14 flex items-center justify-center"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default AddPage;
